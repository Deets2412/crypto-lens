// ============================================================
// CoinDebrief V2 — Email Template
// Dark-themed, glassmorphism-inspired HTML email
// ============================================================

import { BriefingData } from './types';
import { formatCurrency } from './api';

function formatLargeNumber(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toFixed(2)}`;
}

function sentimentPill(sentiment: string): string {
  const colors: Record<string, string> = {
    Bullish: '#22c55e',
    Bearish: '#ef4444',
    Neutral: '#6b7280',
  };
  const color = colors[sentiment] || '#6b7280';
  return `<span style="display:inline-block;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600;color:${color};background:${color}15;border:1px solid ${color}40;">${sentiment}</span>`;
}

function changeColor(val: number): string {
  return val >= 0 ? '#22c55e' : '#ef4444';
}

function changeSign(val: number): string {
  return val >= 0 ? '+' : '';
}

export function renderBriefingEmail(data: BriefingData, appUrl: string): string {
  const { marketOverview, topMovers, topLosers, portfolioSummary, newsHighlights, signOff } = data;

  // Portfolio section (only for Coin Sense users with holdings)
  let portfolioSection = '';
  if (portfolioSummary) {
    portfolioSection = `
    <!-- Portfolio Summary -->
    <tr>
      <td style="padding:0 24px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a2e;border-radius:12px;border:1px solid rgba(255,255,255,0.08);">
          <tr>
            <td style="padding:20px 24px 8px;">
              <h2 style="margin:0;font-size:16px;color:#e0e0e0;font-weight:600;">📊 Your Portfolio</h2>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:8px 0;">
                    <span style="color:#9ca3af;font-size:13px;">Total Value</span><br/>
                    <span style="color:#e0e0e0;font-size:20px;font-weight:700;">${formatLargeNumber(portfolioSummary.totalValue)}</span>
                    <span style="color:${changeColor(portfolioSummary.dayChangePercent)};font-size:14px;margin-left:8px;">${changeSign(portfolioSummary.dayChangePercent)}${portfolioSummary.dayChangePercent.toFixed(1)}%</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:4px 0;">
                    <span style="color:#9ca3af;font-size:12px;">Best: </span><span style="color:#22c55e;font-size:12px;">${portfolioSummary.bestPerformer}</span>
                    <span style="color:#9ca3af;font-size:12px;margin-left:16px;">Worst: </span><span style="color:#ef4444;font-size:12px;">${portfolioSummary.worstPerformer}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 24px 20px;">
              <p style="margin:0;color:#9ca3af;font-size:13px;font-style:italic;">${portfolioSummary.verdict}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
  }

  // News section
  let newsSection = '';
  if (newsHighlights.length > 0) {
    const newsRows = newsHighlights.map((n) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <a href="${n.url}" style="color:#60a5fa;text-decoration:none;font-size:14px;font-weight:500;">${n.title}</a>
              </td>
            </tr>
            <tr>
              <td style="padding-top:4px;">
                ${sentimentPill(n.sentiment)}
                <span style="color:#6b7280;font-size:11px;margin-left:8px;">${n.source}</span>
              </td>
            </tr>
            <tr>
              <td style="padding-top:6px;">
                <p style="margin:0;color:#9ca3af;font-size:12px;font-style:italic;">${n.quip}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `).join('');

    newsSection = `
    <!-- News Highlights -->
    <tr>
      <td style="padding:0 24px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a2e;border-radius:12px;border:1px solid rgba(255,255,255,0.08);">
          <tr>
            <td style="padding:20px 24px 8px;">
              <h2 style="margin:0;font-size:16px;color:#e0e0e0;font-weight:600;">📰 News That Matters (Allegedly)</h2>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 16px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                ${newsRows}
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
  }

  // Movers rows
  const moverRows = (movers: typeof topMovers) => movers.map((m) => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width:50%;">
              <span style="color:#e0e0e0;font-size:14px;font-weight:500;">${m.name}</span>
              <span style="color:#6b7280;font-size:12px;margin-left:4px;">${m.symbol}</span>
            </td>
            <td style="text-align:right;">
              <span style="color:#e0e0e0;font-size:14px;">${formatCurrency(m.price)}</span>
              <span style="color:${changeColor(m.change24h)};font-size:13px;margin-left:8px;font-weight:600;">${changeSign(m.change24h)}${m.change24h.toFixed(1)}%</span>
            </td>
          </tr>
          <tr>
            <td colspan="2" style="padding-top:4px;">
              <p style="margin:0;color:#9ca3af;font-size:12px;font-style:italic;">${m.quip}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CoinDebrief Daily Briefing</title>
</head>
<body style="margin:0;padding:0;background:#0a0a1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a1a;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#12122a;border-radius:16px;border:1px solid rgba(255,255,255,0.06);overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="padding:32px 24px 16px;text-align:center;background:linear-gradient(135deg,#1a1a3e,#12122a);">
              <h1 style="margin:0;font-size:24px;color:#e0e0e0;font-weight:700;">📈 CoinDebrief</h1>
              <p style="margin:8px 0 0;font-size:13px;color:#6b7280;">Daily Briefing · ${data.date}</p>
            </td>
          </tr>

          <!-- Market Mood -->
          <tr>
            <td style="padding:16px 24px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#1a1a3e,#1a1a2e);border-radius:12px;border:1px solid rgba(255,255,255,0.08);">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0;color:#f0f0f0;font-size:15px;font-weight:500;line-height:1.5;">${marketOverview.marketMood}</p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
                      <tr>
                        <td style="text-align:center;width:33%;">
                          <span style="color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Market Cap</span><br/>
                          <span style="color:#e0e0e0;font-size:14px;font-weight:600;">${formatLargeNumber(marketOverview.totalMarketCap)}</span>
                        </td>
                        <td style="text-align:center;width:33%;">
                          <span style="color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">BTC Dominance</span><br/>
                          <span style="color:#f59e0b;font-size:14px;font-weight:600;">${marketOverview.btcDominance.toFixed(1)}%</span>
                        </td>
                        <td style="text-align:center;width:33%;">
                          <span style="color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">24h Volume</span><br/>
                          <span style="color:#e0e0e0;font-size:14px;font-weight:600;">${formatLargeNumber(marketOverview.totalVolume)}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${portfolioSection}

          <!-- Top Movers -->
          <tr>
            <td style="padding:0 24px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a2e;border-radius:12px;border:1px solid rgba(255,255,255,0.08);">
                <tr>
                  <td style="padding:20px 24px 8px;">
                    <h2 style="margin:0;font-size:16px;color:#22c55e;font-weight:600;">🚀 Top Movers</h2>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 24px 16px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      ${moverRows(topMovers)}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Top Losers -->
          <tr>
            <td style="padding:0 24px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a2e;border-radius:12px;border:1px solid rgba(255,255,255,0.08);">
                <tr>
                  <td style="padding:20px 24px 8px;">
                    <h2 style="margin:0;font-size:16px;color:#ef4444;font-weight:600;">💀 Pain Corner</h2>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 24px 16px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      ${moverRows(topLosers)}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${newsSection}

          <!-- Sign Off -->
          <tr>
            <td style="padding:8px 24px 24px;text-align:center;">
              <p style="margin:0;color:#6b7280;font-size:13px;font-style:italic;line-height:1.5;">${signOff}</p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:0 24px 24px;text-align:center;">
              <a href="${appUrl}" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">Open CoinDebrief Dashboard</a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 24px 24px;text-align:center;border-top:1px solid rgba(255,255,255,0.05);">
              <p style="margin:0;color:#4b5563;font-size:11px;">
                CoinDebrief · Crypto Intelligence, Zero BS<br/>
                <a href="${appUrl}/settings" style="color:#4b5563;text-decoration:underline;">Manage email preferences</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
