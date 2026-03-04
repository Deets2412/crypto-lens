# CoinDebrief — Crypto Intelligence, Zero BS

A data-driven crypto intelligence platform with a sardonic editorial voice. Live market data, algorithmic scoring, BS detection, and brutally honest portfolio analysis.

**Live:** [crypto-lens-kappa.vercel.app](https://crypto-lens-kappa.vercel.app)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Custom CSS (dark glassmorphism) |
| Language | TypeScript 5 (strict mode) |
| Auth | Supabase Auth (email/password + magic link) |
| Database | Supabase PostgreSQL (profiles, subscriptions, portfolio, email prefs) |
| Payments | Stripe Checkout + Webhooks + Customer Portal |
| Email | Resend (daily briefing via Vercel Cron) |
| Charts | Recharts |
| Data | CoinGecko (top 100 coins) + CryptoCompare (news) |

## Architecture

```
┌────────────────────────────────────────┐
│           Next.js App Router           │
├──────────────┬─────────────────────────┤
│   Frontend   │      API Routes         │
│  React 19    │  /api/stripe/*          │
│  App Router  │  /api/portfolio         │
│  Custom CSS  │  /api/settings          │
│              │  /api/admin/stats       │
│              │  /api/leads             │
│              │  /api/cron/daily-briefing│
├──────────────┴─────────────────────────┤
│           Core Engines (src/lib/)       │
│  scoring.ts    → Composite scoring     │
│  commentary.ts → BS Meter + Real Talk  │
│  portfolio.ts  → X-Ray analysis        │
│  briefing.ts   → Email briefing gen    │
│  email-template.ts → HTML email        │
│  auth.tsx      → Supabase Auth context │
├────────────────────────────────────────┤
│     Supabase (PostgreSQL + Auth)       │
│  profiles │ subscriptions │ leads      │
│  portfolio_holdings │ email_preferences│
├────────────────────────────────────────┤
│        External APIs                   │
│  CoinGecko │ CryptoCompare │ Stripe   │
└────────────────────────────────────────┘
```

## Subscription Tiers

| Feature | Normie ($5/mo) | Night Owl ($15/mo) | Coin Sense ($29/mo) |
|---------|:--------------:|:------------------:|:-------------------:|
| Dashboard + News | ✅ | ✅ | ✅ |
| Blue Chip Recommendations | ✅ | ✅ | ✅ |
| Casino Analysis | — | ✅ | ✅ |
| Investment Screener | — | ✅ | ✅ |
| Daily Email Briefing | — | ✅ | ✅ |
| Portfolio X-Ray | — | — | ✅ |
| Portfolio in Email | — | — | ✅ |
| 14-day free trial | ✅ | — | — |

## Pages

| Route | Description | Tier |
|-------|-------------|------|
| `/` | Dashboard — market overview, top movers, news feed | All |
| `/news` | News & Signals — sentiment-scored crypto news | All |
| `/recommendations` | Blue Chip recommendations with confidence scores | All |
| `/casino` | Casino-grade altcoin analysis with wipeout risk | Night Owl+ |
| `/screener` | Investment screener with fundamental/technical scoring | Night Owl+ |
| `/portfolio` | Portfolio X-Ray — holdings analysis, BS score, rebalancing | Coin Sense |
| `/settings` | Email preferences, account management | All |
| `/admin` | Admin dashboard — user stats, tier breakdown, leads | Admin only |
| `/pricing` | Pricing page with tier comparison | Public |
| `/login` | Login page | Public |
| `/signup` | Signup page | Public |

## Setup

### 1. Clone and install

```bash
git clone https://github.com/Deets2412/crypto-lens.git
cd crypto-lens
npm install
```

### 2. Environment variables

Copy `.env.local.example` to `.env.local` and fill in:

```bash
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PRICE_NORMIE=price_xxx
STRIPE_PRICE_NIGHT_OWL=price_xxx
STRIPE_PRICE_COIN_SENSE=price_xxx

# Resend (daily email briefing)
RESEND_API_KEY=re_...

# Vercel Cron
CRON_SECRET=your-random-secret
```

### 3. Database setup

Run `supabase-schema.sql` in your Supabase SQL Editor. This creates:
- `profiles` (user accounts, tier, admin role)
- `subscriptions` (Stripe subscription sync)
- `leads` (email collection)
- `portfolio_holdings` (user crypto holdings)
- `email_preferences` (daily briefing settings)

All tables have Row Level Security enabled.

### 4. Stripe setup

Create 3 products in Stripe Dashboard:
- **Normie** — $5/month (recurring)
- **Night Owl** — $15/month (recurring)
- **Coin Sense** — $29/month (recurring)

Copy each price ID to the env vars.

### 5. Admin account

After signing up, promote yourself to admin:
```sql
UPDATE public.profiles SET role = 'admin' WHERE email = 'your@email.com';
```

### 6. Run

```bash
npm run dev
```

## Scoring Engine

Each coin receives a **composite score** (0-100):
- **Fundamental Score (40%)** — market cap rank, volume-to-mcap ratio, supply scarcity
- **Technical Score (60%)** — 24h/7d price momentum, ATH distance

### BS Meter
- **Blue Chips** → "Corporate Fluff Score" — measures marketing hype vs substance
- **Casino Coins** → "Wipeout Risk Score" — measures likelihood of implosion

### Portfolio X-Ray
- **Portfolio BS Score** — value-weighted average across all holdings
- **Diversification Grade** (A-F) — based on concentration, category balance
- **Risk Concentration** — single-point-of-failure detection
- **Rebalancing Suggestions** — data-driven, sarcastically delivered

## Daily Briefing

Automated email sent at 6:00 AM UTC via Vercel Cron + Resend:
- Market mood (sardonic one-liner)
- Top 3 movers + top 3 losers with quips
- Sentiment-scored news highlights
- Portfolio summary (Coin Sense tier only)

## Project Structure

```
src/
├── app/
│   ├── admin/page.tsx          # Admin dashboard
│   ├── api/
│   │   ├── admin/stats/route.ts
│   │   ├── cron/daily-briefing/route.ts
│   │   ├── leads/route.ts
│   │   ├── portfolio/route.ts
│   │   ├── settings/route.ts
│   │   └── stripe/
│   │       ├── checkout/route.ts
│   │       ├── portal/route.ts
│   │       └── webhook/route.ts
│   ├── auth/callback/route.ts
│   ├── casino/page.tsx
│   ├── login/page.tsx
│   ├── news/page.tsx
│   ├── portfolio/page.tsx
│   ├── pricing/page.tsx
│   ├── recommendations/page.tsx
│   ├── screener/page.tsx
│   ├── settings/page.tsx
│   ├── signup/page.tsx
│   ├── globals.css              # Full design system (~3000 lines)
│   ├── layout.tsx
│   └── page.tsx                 # Dashboard
├── components/
│   ├── AppShell.tsx             # Layout + data provider + error boundary
│   ├── BSMeter.tsx
│   ├── CoinDetailModal.tsx
│   ├── ConfidenceGauge.tsx
│   ├── ErrorBoundary.tsx
│   ├── Header.tsx
│   ├── LeadCaptureModal.tsx
│   ├── RealTalkCard.tsx
│   ├── Sidebar.tsx
│   ├── SparklineChart.tsx
│   ├── TierBadge.tsx
│   └── ToggleGroup.tsx
├── lib/
│   ├── api.ts                   # CoinGecko + CryptoCompare
│   ├── auth.tsx                 # Supabase Auth context
│   ├── briefing.ts              # Daily email generator
│   ├── commentary.ts            # BS Meter + Real Talk
│   ├── email-template.ts        # HTML email template
│   ├── portfolio.ts             # Portfolio X-Ray engine
│   ├── scoring.ts               # Composite scoring engine
│   ├── supabase-server.ts       # Server-side Supabase client
│   ├── supabase.ts              # Browser Supabase client
│   └── types.ts                 # All TypeScript interfaces
├── middleware.ts                 # Auth + session refresh
```

---

*CoinDebrief v2.0 — Built with Next.js 16, Supabase, Stripe, and a healthy dose of cynicism.*
