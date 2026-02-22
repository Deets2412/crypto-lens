// ============================================================
// CryptoLens V2 — Commentary & Editorial Voice Engine
// "A cynical, battle-hardened analyst"
// ============================================================

import { Coin, CoinCategory, BSMeterData, RealTalkData } from './types';

// ==================== BS METER ====================

const FLUFF_LABELS: [number, string][] = [
    [15, 'Refreshingly Honest (suspicious)'],
    [35, 'Only Slightly Full of It'],
    [55, 'Standard Corporate Waffle'],
    [75, 'Buzzword Bingo Champion'],
    [90, 'Written By ChatGPT, Probably'],
    [101, 'Sir, This Is a Wendy\'s'],
];

const WIPEOUT_LABELS: [number, string][] = [
    [15, 'Weirdly Still Alive'],
    [35, 'Holding Together With Duct Tape'],
    [55, 'Pack a Parachute'],
    [70, 'Your Therapist Will Hear About This'],
    [85, 'Abandon Ship (Politely)'],
    [101, 'lmao good luck'],
];

function getLabel(score: number, labels: [number, string][]): string {
    for (const [threshold, label] of labels) {
        if (score < threshold) return label;
    }
    return labels[labels.length - 1][1];
}

export function calculateBSMeter(
    coin: Coin,
    category: CoinCategory,
    supplyRatio: number,
    volumeToMcap: number,
    athDistance: number
): BSMeterData {
    if (category === 'blue-chip') {
        // Corporate Fluff Score — higher = more "BS"
        let score = 30; // baseline: big coins have some fluff
        const factors: string[] = [];

        // Near ATH = more hype (everyone's a genius in a bull run)
        if (athDistance > -10) {
            score += 20;
            factors.push('Trading near ATH — everyone\'s a genius right now, just wait');
        } else if (athDistance > -30) {
            score += 10;
            factors.push('Close enough to ATH that the marketing team is doing victory laps');
        }

        // High supply ratio = less scarcity narrative to exploit
        if (supplyRatio > 0.85) {
            score -= 10;
            factors.push('Most supply out there — one less thing to worry about, honestly');
        } else if (supplyRatio < 0.5) {
            score += 15;
            factors.push(`Only ${(supplyRatio * 100).toFixed(0)}% circulating — convenient for "limited edition" vibes`);
        }

        // Low volume relative to cap = "store of value" narrative
        if (volumeToMcap < 0.03) {
            score += 10;
            factors.push('Nobody\'s actually trading this — it\'s a digital paperweight that goes up sometimes');
        }

        // Top 5 always get extra fluff points
        if (coin.market_cap_rank <= 5) {
            score += 10;
            factors.push('Top 5 coin — your dentist asked you about this at your last checkup');
        }

        score = Math.min(100, Math.max(0, score));
        return { score, label: getLabel(score, FLUFF_LABELS), variant: 'fluff', factors };

    } else {
        // Wipeout Risk Score — higher = more likely to implode
        let score = 40; // baseline: casino coins start risky
        const factors: string[] = [];

        const change24h = Math.abs(coin.price_change_percentage_24h || 0);

        // High 24h volatility
        if (change24h > 20) {
            score += 25;
            factors.push(`${change24h.toFixed(1)}% swing in 24h — this thing has the stability of a toddler on a sugar rush`);
        } else if (change24h > 10) {
            score += 15;
            factors.push(`${change24h.toFixed(1)}% daily swing — your heart rate and this chart have a lot in common`);
        } else if (change24h > 5) {
            score += 8;
            factors.push('Just volatile enough to ruin your dinner plans');
        }

        // Far from ATH = potential zero trajectory
        if (athDistance < -90) {
            score += 20;
            factors.push(`Down ${Math.abs(athDistance).toFixed(0)}% from ATH — that\'s not a dip, that\'s a lifestyle`);
        } else if (athDistance < -70) {
            score += 12;
            factors.push(`${Math.abs(athDistance).toFixed(0)}% below ATH — the people who bought the top are very quiet on Twitter now`);
        }

        // Low supply ratio = token unlock sword of Damocles
        if (supplyRatio < 0.3) {
            score += 15;
            factors.push(`Only ${(supplyRatio * 100).toFixed(0)}% circulating — the rest are in a vault labeled "surprise dilution"`);
        } else if (supplyRatio < 0.5) {
            score += 8;
            factors.push('Half the supply still locked — nothing says "trust us" like hidden tokens');
        }

        // Very low volume = illiquid death trap
        if (volumeToMcap < 0.02) {
            score += 10;
            factors.push('Paper-thin liquidity — selling this is like trying to leave a party through the window');
        }

        // Low market cap rank
        if (coin.market_cap_rank > 70) {
            score += 8;
            factors.push('Ranked below 70 — we\'re in the crypto equivalent of the kiddie pool');
        }

        score = Math.min(100, Math.max(0, score));
        return { score, label: getLabel(score, WIPEOUT_LABELS), variant: 'wipeout', factors };
    }
}

// ==================== OFFICIAL DESCRIPTIONS ====================

const OFFICIAL_DESCRIPTIONS: Record<string, string> = {
    bitcoin: 'Bitcoin is the first decentralized digital currency. As a peer-to-peer electronic cash system, it enables direct value transfer without intermediaries, secured by a proof-of-work consensus mechanism that ensures network integrity and immutability.',
    ethereum: 'Ethereum is the world\'s leading programmable blockchain. Its smart contract platform enables developers to build decentralized applications (dApps) and is the foundation of the DeFi ecosystem, NFT markets, and Web3 innovation.',
    tether: 'Tether (USDT) is the most widely used stablecoin, pegged 1:1 to the US Dollar. It serves as the de facto trading pair and liquidity backbone of the cryptocurrency ecosystem, facilitating seamless value transfer across exchanges worldwide.',
    binancecoin: 'BNB powers the Binance ecosystem, the world\'s largest cryptocurrency exchange. BNB Chain offers high throughput and low transaction costs for decentralized applications, smart contracts, and cross-chain interoperability.',
    solana: 'Solana is a high-performance blockchain designed for mass adoption. With sub-second finality and transaction costs of fractions of a penny, Solana supports a thriving ecosystem of DeFi protocols, NFT marketplaces, and consumer applications.',
    ripple: 'XRP is the native digital asset of the XRP Ledger, designed for enterprise-grade cross-border payments. RippleNet leverages XRP for on-demand liquidity, enabling financial institutions to send money globally in seconds.',
    'usd-coin': 'USD Coin (USDC) is a fully reserved, regulated digital dollar issued by Circle. Each USDC is backed by cash and short-duration US Treasuries, providing a transparent and audited stablecoin solution for the digital economy.',
    cardano: 'Cardano is a proof-of-stake blockchain platform built on peer-reviewed research and formal methods. Its methodical approach to development aims to deliver more secure, scalable, and sustainable infrastructure for decentralized systems.',
    dogecoin: 'Dogecoin started as a lighthearted alternative to Bitcoin but has grown into one of the most recognized cryptocurrencies globally. Supported by a passionate community, DOGE has become a widely accepted medium for tipping and microtransactions.',
    avalanche: 'Avalanche is an ultra-fast, low-cost blockchain platform for dApps and custom blockchain networks. Its unique consensus protocol achieves near-instant finality while maintaining decentralization and security at scale.',
    polkadot: 'Polkadot enables cross-blockchain transfers of any type of data or asset. By connecting multiple specialized chains into one unified network, Polkadot delivers unprecedented interoperability, scalability, and shared security.',
    chainlink: 'Chainlink is the industry standard for decentralized oracle networks. It provides tamper-proof data feeds, verifiable randomness, and cross-chain communication to power the next generation of smart contract applications.',
    tron: 'TRON is a decentralized content entertainment ecosystem that uses blockchain technology to eliminate intermediaries between creators and consumers, enabling free, global, and decentralized content sharing.',
    'shiba-inu': 'Shiba Inu is a decentralized meme token that has evolved into a vibrant ecosystem. Born as an experiment in decentralized community building, SHIB now features its own DEX (ShibaSwap), metaverse plans, and an expanding range of utilities.',
    litecoin: 'Litecoin is a peer-to-peer cryptocurrency created as the "silver to Bitcoin\'s gold." With faster block generation times and a modified hashing algorithm, LTC offers quicker transaction confirmations for everyday commerce.',
    'matic-network': 'Polygon provides Ethereum scaling solutions through Layer 2 chains. Its suite of protocols offers fast, low-cost transactions while leveraging Ethereum\'s security, making Web3 accessible to billions of users.',
    stellar: 'Stellar is an open network for storing and moving money. The Stellar network makes it possible to create, send, and trade digital representations of all forms of money, connecting people and payment systems worldwide.',
    cosmos: 'Cosmos is the Internet of Blockchains. Its Inter-Blockchain Communication (IBC) protocol enables sovereign blockchains to exchange data and tokens, building an interconnected ecosystem of interoperable chains.',
    'near-protocol': 'NEAR Protocol is a layer-1 blockchain designed with usability at its core. Human-readable accounts, seamless onboarding, and a developer-friendly environment make NEAR the platform of choice for mainstream Web3 adoption.',
    uniswap: 'Uniswap is the leading decentralized exchange protocol on Ethereum. Its automated market maker (AMM) model revolutionized token trading by eliminating order books and enabling permissionless liquidity provision.',
};

function getOfficialDescription(coinId: string): string {
    return OFFICIAL_DESCRIPTIONS[coinId] ||
        `${coinId.charAt(0).toUpperCase() + coinId.slice(1).replace(/-/g, ' ')} is a cryptocurrency project aiming to deliver innovative blockchain solutions through cutting-edge technology and community-driven development. The project seeks to revolutionize its sector through decentralized infrastructure and strategic partnerships.`;
}

// ==================== REAL TALK GENERATOR ====================

export function generateRealTalk(
    coin: Coin,
    category: CoinCategory,
    supplyRatio: number,
    athDistance: number,
    volumeToMcap: number
): RealTalkData {
    const officialDescription = getOfficialDescription(coin.id);
    let realTalk: string;

    const change24h = coin.price_change_percentage_24h || 0;

    if (category === 'blue-chip') {
        // Clinical, skeptical, treating it like a boring bond
        const parts: string[] = [];

        if (coin.market_cap_rank <= 3) {
            parts.push(`Look, ${coin.name} is ranked #${coin.market_cap_rank}. It's the missionary position of crypto — predictable, reliable, and your accountant won't cry when they see it in your portfolio.`);
        } else if (coin.market_cap_rank <= 10) {
            parts.push(`${coin.name} sits at #${coin.market_cap_rank}. It's the crypto you put in your portfolio to look responsible before YOLOing the rest into something called "ElonMoonRocket." We see you.`);
        } else {
            parts.push(`#${coin.market_cap_rank} by market cap. The crypto equivalent of a Toyota Camry. Nobody gets excited about it, but it probably won't explode in the driveway.`);
        }

        if (athDistance > -10) {
            parts.push(`Near its ATH right now, which means your coworker who "got into crypto" last week won't shut up about it. Give it two weeks.`);
        } else if (athDistance < -50) {
            parts.push(`Currently ${Math.abs(athDistance).toFixed(0)}% below its ATH. The "diamond hands" crowd has gone suspiciously silent. You can hear crickets in their Discord.`);
        }

        if (volumeToMcap < 0.03) {
            parts.push(`Trading volume is essentially a flatline. Everyone's HODLing, which is a fancy way of saying "too traumatized to open the app."`);
        } else if (volumeToMcap > 0.15) {
            parts.push(`Volume is absolutely pumping. Either it's the bots having a party, or someone on TikTok said something.`);
        }

        if (change24h > 5) {
            parts.push(`Up ${change24h.toFixed(1)}% today. Quick, screenshot it and post it before it reverses. That's content, baby.`);
        } else if (change24h < -5) {
            parts.push(`Down ${Math.abs(change24h).toFixed(1)}% today. Reddit is calling it a "fire sale" which is technically accurate — something IS on fire.`);
        }

        realTalk = parts.join(' ');

    } else {
        // Sounds like a compulsive gambler at 2am — honest, a bit manic
        const parts: string[] = [];

        parts.push(`Right. ${coin.name}. *cracks knuckles* Let's talk.`);

        if (coin.market_cap_rank > 70) {
            parts.push(`Ranked #${coin.market_cap_rank}. We're so deep in the crypto roster that even CoinGecko needs a minute to find it. This is where portfolios go on vacation and never come back. But ALSO where legends are born, so... 🎲`);
        } else if (coin.market_cap_rank > 40) {
            parts.push(`#${coin.market_cap_rank} on the charts. It exists in the crypto uncanny valley — too big to be a "hidden gem" but too small for your boomer uncle to ask about at Thanksgiving.`);
        } else {
            parts.push(`Ranked #${coin.market_cap_rank} — pretty high up for something that moves like it's being driven by a teenager who just got their learner's permit.`);
        }

        if (athDistance < -80) {
            parts.push(`Down ${Math.abs(athDistance).toFixed(0)}% from its peak. The ATH is now more of a cute memory. Like remembering when you thought crypto would pay off your student loans. 🥲`);
        } else if (athDistance < -50) {
            parts.push(`${Math.abs(athDistance).toFixed(0)}% below its best day ever. The people who bought the top have started a support group. It meets on Telegram. Nobody talks.`);
        } else if (athDistance > -15) {
            parts.push(`Near its ATH which means either: (a) genuine breakout, or (b) you're about to star in a "I bought the top" meme. Exciting either way!`);
        }

        if (supplyRatio < 0.3) {
            parts.push(`Oh, and ${(100 - supplyRatio * 100).toFixed(0)}% of the supply hasn't hit the market yet. That's not a red flag — that's a red flag wearing another red flag as a cape, riding a red horse. 🚩`);
        }

        if (change24h > 15) {
            parts.push(`+${change24h.toFixed(1)}% in 24 hours. The FOMO is hitting you right now isn't it? I can feel it through the screen. Step away from the "Buy" button. Or don't. I'm a website, not your mom. 🚀`);
        } else if (change24h < -15) {
            parts.push(`Down ${Math.abs(change24h).toFixed(1)}% today. The Telegram chat has devolved into nothing but 🔥 emojis and people posting "this is fine" dog memes. Honestly? It might actually be fine. Or not. Surprise! 🎁`);
        }

        realTalk = parts.join(' ');
    }

    return { officialDescription, realTalk };
}
