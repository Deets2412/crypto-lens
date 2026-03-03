// ============================================================
// CoinDebrief V2 — Portfolio X-Ray Engine
// "Your portfolio, roasted with data"
// ============================================================

import {
  Coin,
  PortfolioHolding,
  PortfolioPosition,
  PortfolioAnalysis,
  RiskConcentration,
  RebalancingSuggestion,
  RiskRating,
} from './types';
import { scoreScreenerRow, categorizeCoin } from './scoring';

// ==================== PORTFOLIO ANALYSIS ====================

export function analyzePortfolio(
  holdings: PortfolioHolding[],
  coins: Coin[]
): PortfolioAnalysis {
  // Build a lookup map for quick coin matching
  const coinMap = new Map(coins.map((c) => [c.id.toLowerCase(), c]));

  // Build enriched positions
  const positions: PortfolioPosition[] = holdings
    .map((h) => {
      const coin = coinMap.get(h.coinId.toLowerCase());
      if (!coin) return null;

      const screenerRow = scoreScreenerRow(coin);
      const currentValue = h.amount * coin.current_price;
      const costBasis = h.amount * h.buyPrice;
      const pnl = currentValue - costBasis;
      const pnlPercent = costBasis > 0 ? (pnl / costBasis) * 100 : 0;

      const change24h = Math.abs(coin.price_change_percentage_24h || 0);
      let riskRating: RiskRating = 'Medium';
      if (coin.market_cap_rank <= 10 && change24h < 5) riskRating = 'Low';
      else if (coin.market_cap_rank > 50 || change24h > 15) riskRating = 'High';

      return {
        ...h,
        currentPrice: coin.current_price,
        currentValue,
        costBasis,
        pnl,
        pnlPercent,
        allocation: 0, // calculated after totals
        category: screenerRow.category,
        compositeScore: screenerRow.compositeScore,
        bsMeterScore: screenerRow.bsMeterScore,
        riskRating,
      } as PortfolioPosition;
    })
    .filter((p): p is PortfolioPosition => p !== null);

  // Calculate totals
  const totalValue = positions.reduce((sum, p) => sum + p.currentValue, 0);
  const totalCostBasis = positions.reduce((sum, p) => sum + p.costBasis, 0);
  const totalPnl = totalValue - totalCostBasis;
  const totalPnlPercent = totalCostBasis > 0 ? (totalPnl / totalCostBasis) * 100 : 0;

  // Set allocation percentages
  positions.forEach((p) => {
    p.allocation = totalValue > 0 ? (p.currentValue / totalValue) * 100 : 0;
  });

  // Sort by allocation descending
  positions.sort((a, b) => b.allocation - a.allocation);

  // Weighted scores
  const portfolioBSScore = totalValue > 0
    ? Math.round(positions.reduce((sum, p) => sum + p.bsMeterScore * (p.currentValue / totalValue), 0))
    : 0;

  const portfolioCompositeScore = totalValue > 0
    ? Math.round(positions.reduce((sum, p) => sum + p.compositeScore * (p.currentValue / totalValue), 0))
    : 0;

  // Risk concentration
  const riskConcentration = calculateRiskConcentration(positions);

  // Diversification grade
  const diversificationGrade = gradeDiversification(positions, riskConcentration);

  // Rebalancing suggestions
  const rebalancingSuggestions = generateRebalancingSuggestions(positions, riskConcentration);

  // Sardonic commentary
  const topRisk = generateTopRisk(positions, riskConcentration);
  const overallVerdict = generateOverallVerdict(
    positions,
    totalPnlPercent,
    riskConcentration,
    diversificationGrade,
    portfolioBSScore
  );

  return {
    positions,
    totalValue,
    totalCostBasis,
    totalPnl,
    totalPnlPercent,
    portfolioBSScore,
    portfolioCompositeScore,
    riskConcentration,
    diversificationGrade,
    rebalancingSuggestions,
    topRisk,
    overallVerdict,
  };
}

// ==================== RISK CONCENTRATION ====================

function calculateRiskConcentration(positions: PortfolioPosition[]): RiskConcentration {
  if (positions.length === 0) {
    return {
      topHoldingPercent: 0,
      top3HoldingPercent: 0,
      casinoPercent: 0,
      blueChipPercent: 0,
      singlePointOfFailure: false,
    };
  }

  const sorted = [...positions].sort((a, b) => b.allocation - a.allocation);
  const topHoldingPercent = sorted[0]?.allocation || 0;
  const top3HoldingPercent = sorted.slice(0, 3).reduce((sum, p) => sum + p.allocation, 0);
  const casinoPercent = positions
    .filter((p) => p.category === 'casino')
    .reduce((sum, p) => sum + p.allocation, 0);
  const blueChipPercent = positions
    .filter((p) => p.category === 'blue-chip')
    .reduce((sum, p) => sum + p.allocation, 0);

  return {
    topHoldingPercent: Math.round(topHoldingPercent * 10) / 10,
    top3HoldingPercent: Math.round(top3HoldingPercent * 10) / 10,
    casinoPercent: Math.round(casinoPercent * 10) / 10,
    blueChipPercent: Math.round(blueChipPercent * 10) / 10,
    singlePointOfFailure: topHoldingPercent > 40,
  };
}

// ==================== DIVERSIFICATION GRADE ====================

function gradeDiversification(
  positions: PortfolioPosition[],
  risk: RiskConcentration
): string {
  if (positions.length === 0) return 'F';

  let score = 50; // baseline

  // Number of positions bonus
  if (positions.length >= 8) score += 15;
  else if (positions.length >= 5) score += 10;
  else if (positions.length >= 3) score += 5;
  else score -= 15; // 1-2 positions = bad

  // Concentration penalty
  if (risk.topHoldingPercent > 50) score -= 20;
  else if (risk.topHoldingPercent > 35) score -= 10;
  else if (risk.topHoldingPercent < 25) score += 10;

  // Casino exposure
  if (risk.casinoPercent > 50) score -= 15;
  else if (risk.casinoPercent > 30) score -= 5;
  else if (risk.casinoPercent < 15) score += 10;

  // Single point of failure
  if (risk.singlePointOfFailure) score -= 10;

  // Blue chip presence
  if (risk.blueChipPercent > 50) score += 10;
  else if (risk.blueChipPercent < 20) score -= 10;

  if (score >= 80) return 'A';
  if (score >= 65) return 'B';
  if (score >= 50) return 'C';
  if (score >= 35) return 'D';
  return 'F';
}

// ==================== REBALANCING SUGGESTIONS ====================

function generateRebalancingSuggestions(
  positions: PortfolioPosition[],
  risk: RiskConcentration
): RebalancingSuggestion[] {
  const suggestions: RebalancingSuggestion[] = [];

  for (const pos of positions) {
    // Over-concentrated position
    if (pos.allocation > 40) {
      suggestions.push({
        type: 'reduce',
        coinName: pos.name,
        reason: `${pos.allocation.toFixed(0)}% of your portfolio in one coin. That's not conviction, that's a hostage situation.`,
      });
    }

    // Massive losses on a casino coin
    if (pos.pnlPercent < -50 && pos.category === 'casino') {
      suggestions.push({
        type: 'exit',
        coinName: pos.name,
        reason: `Down ${Math.abs(pos.pnlPercent).toFixed(0)}%. At some point, "diamond hands" becomes "denial." This might be that point.`,
      });
    }

    // High BS score with large allocation
    if (pos.bsMeterScore > 70 && pos.allocation > 15) {
      suggestions.push({
        type: 'reduce',
        coinName: pos.name,
        reason: `BS Meter at ${pos.bsMeterScore}/100 and it's ${pos.allocation.toFixed(0)}% of your portfolio. That's a lot of money riding on vibes.`,
      });
    }

    // Very high risk with decent allocation
    if (pos.riskRating === 'High' && pos.allocation > 20) {
      suggestions.push({
        type: 'reduce',
        coinName: pos.name,
        reason: `High risk coin at ${pos.allocation.toFixed(0)}% allocation. Your risk tolerance isn't a personality — it's a liability.`,
      });
    }
  }

  // Not enough blue chips
  if (risk.blueChipPercent < 30 && positions.length > 0) {
    suggestions.push({
      type: 'diversify',
      coinName: 'Blue Chips',
      reason: `Only ${risk.blueChipPercent.toFixed(0)}% in blue chips. Even degenerate traders keep a safety net. Usually.`,
    });
  }

  // Too much casino
  if (risk.casinoPercent > 60) {
    suggestions.push({
      type: 'reduce',
      coinName: 'Casino Coins',
      reason: `${risk.casinoPercent.toFixed(0)}% in casino-grade coins. This portfolio has more volatility than a Twitter argument about Dogecoin.`,
    });
  }

  return suggestions.slice(0, 5); // cap at 5 suggestions
}

// ==================== SARDONIC COMMENTARY ====================

function generateTopRisk(
  positions: PortfolioPosition[],
  risk: RiskConcentration
): string {
  if (positions.length === 0) {
    return 'Your biggest risk is having no portfolio. Bold strategy.';
  }

  if (risk.singlePointOfFailure) {
    const top = positions[0];
    return `${top.name} is ${risk.topHoldingPercent.toFixed(0)}% of your portfolio. If it sneezes, your net worth catches pneumonia.`;
  }

  if (risk.casinoPercent > 70) {
    return `${risk.casinoPercent.toFixed(0)}% casino exposure. You don't have a portfolio — you have a scratch card collection with extra steps.`;
  }

  const biggestLoser = [...positions].sort((a, b) => a.pnlPercent - b.pnlPercent)[0];
  if (biggestLoser && biggestLoser.pnlPercent < -40) {
    return `${biggestLoser.name} is down ${Math.abs(biggestLoser.pnlPercent).toFixed(0)}%. It's not a loss until you sell, but it IS a regret right now.`;
  }

  if (positions.length <= 2) {
    return 'Two coins is not a portfolio, it\'s a coin flip. Literally.';
  }

  return 'No single catastrophic risk detected. Which in crypto means the catastrophe hasn\'t happened yet.';
}

function generateOverallVerdict(
  positions: PortfolioPosition[],
  totalPnlPercent: number,
  risk: RiskConcentration,
  grade: string,
  bsScore: number
): string {
  if (positions.length === 0) {
    return 'Empty portfolio detected. Either you\'re incredibly disciplined or incredibly indecisive.';
  }

  const verdicts: string[] = [];

  // PnL commentary
  if (totalPnlPercent > 50) {
    verdicts.push(`Up ${totalPnlPercent.toFixed(0)}% overall. You're either a genius or incredibly lucky. History suggests the latter, but enjoy it.`);
  } else if (totalPnlPercent > 10) {
    verdicts.push(`Up ${totalPnlPercent.toFixed(0)}%. Not bad. You've outperformed most people who "do their own research" on YouTube.`);
  } else if (totalPnlPercent > -5) {
    verdicts.push('Roughly flat. You could have just held cash and slept better, but where\'s the fun in that?');
  } else if (totalPnlPercent > -30) {
    verdicts.push(`Down ${Math.abs(totalPnlPercent).toFixed(0)}%. Could be worse. Could also be better. In crypto, "could be worse" is actually a compliment.`);
  } else {
    verdicts.push(`Down ${Math.abs(totalPnlPercent).toFixed(0)}%. On the bright side, you've learned an expensive lesson about market cycles. You have, right?`);
  }

  // Grade commentary
  if (grade === 'A') {
    verdicts.push('Diversification grade: A. Suspiciously well-balanced. Are you sure you belong in crypto?');
  } else if (grade === 'F') {
    verdicts.push('Diversification grade: F. This portfolio was assembled by someone who confuses "all in" with "strategy."');
  }

  // BS commentary
  if (bsScore > 70) {
    verdicts.push(`Portfolio BS Score: ${bsScore}/100. You've essentially invested in a collection of marketing buzzwords.`);
  }

  return verdicts.join(' ');
}

// ==================== PORTFOLIO BS SCORE LABEL ====================

export function getPortfolioBSLabel(score: number): string {
  if (score < 20) return 'Remarkably Grounded';
  if (score < 40) return 'Mostly Sane';
  if (score < 55) return 'Teetering on the Edge';
  if (score < 70) return 'Deep in the Kool-Aid';
  if (score < 85) return 'Full Clown Portfolio';
  return 'Sir, This Is Intervention Territory';
}

export function getDiversificationEmoji(grade: string): string {
  switch (grade) {
    case 'A': return '🏆';
    case 'B': return '👍';
    case 'C': return '🤷';
    case 'D': return '😬';
    case 'F': return '💀';
    default: return '❓';
  }
}
