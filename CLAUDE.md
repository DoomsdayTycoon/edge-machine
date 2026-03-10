# CLAUDE.md — Edge Machine Tennis Betting System

## Project Overview
Tennis betting edge detection and bankroll compounding system. Finds mispriced odds by modeling unorthodox variables that bookmakers systematically underprice.

**Live URL:** edge-machine-opal.vercel.app
**Repo:** github.com/DoomsdayTycoon/edge-machine
**Hosting:** Vercel (auto-deploys on push to main)
**Stack:** Vite + React (JavaScript) — single-page app

## Project Structure
```
EdgePageTennis/
├── src/
│   ├── App.jsx          ← Main component (entire app lives here)
│   ├── App.css          ← Empty (styles are inline in App.jsx)
│   ├── index.css        ← Minimal reset (margin/padding/bg only)
│   └── main.jsx         ← React entry point
├── index.html
├── package.json
├── vite.config.js
└── CLAUDE.md            ← This file
```

## Architecture
Currently a **single-file React app** (`src/App.jsx`). All logic, styles, and state live in one component. This is intentional for simplicity but can be modularized as it grows.

### Key Sections in App.jsx
1. **MOCK_MATCHES** (top) — Sample match data. Will be replaced with live API feeds.
2. **calcEdge()** — Core edge calculation engine with 12 unorthodox factors.
3. **kellyFraction()** — Kelly criterion stake sizing with fractional Kelly support.
4. **App component** — Main UI with 6 tabs: Match Feed, Edge Scanner, Factors, Monte Carlo, Bet Log, Deploy.

### 12 Edge Factors (the secret sauce)
These are variables bookmakers typically don't model:
- Circadian Disruption (timezone/jet lag)
- Travel Fatigue (hours traveled)
- Altitude Delta (elevation change between tournaments)
- Accumulated Fatigue (match load over recent weeks)
- Recovery Window (days since last match)
- Surface Win Rate (historical surface-specific performance)
- In-Match Momentum (live psychological shifts)
- Recent Form Trend (weighted last-5 results)
- 2nd Serve Dominance (most undervalued stat in tennis)
- Break Point Resilience (mental toughness under pressure)
- Age-Surface Decay (older players lose speed on fast courts)
- Rank Delta (baseline — kept low weight to avoid double-counting)

### Settings System
Adjustable via the ⚙ gear icon in the header:
- **Min Odds: 1.60** (default) — filters out bets below this threshold
- Max Odds, Min EV %, Max Kelly %, Min/Max Stake — all adjustable
- Auto-refresh toggle (30s interval)

## Design System
- **Font:** JetBrains Mono (loaded from Google Fonts)
- **Background:** #06080d (near-black)
- **Card background:** #0c1018
- **Borders:** #151d2b
- **Accent green:** #00e87b (positive values, CTAs)
- **Red:** #ff3b5c (negative values, losses)
- **Yellow:** #f0c030 (neutral/warnings)
- **Blue:** #3b8bff (informational, odds)
- **All styles are inline** — no CSS files used for the app itself

## Development
```bash
npm run dev          # Start dev server at localhost:5173
npm run build        # Build for production
```

## Deployment
```bash
git add .
git commit -m "description of change"
git push             # Vercel auto-deploys from main branch
```

Git remote uses token auth:
```
https://DoomsdayTycoon:TOKEN@github.com/DoomsdayTycoon/edge-machine.git
```

## Planned Features
- [ ] **Automated Screener** — Live data feed replacing MOCK_MATCHES with real API data
- [ ] **Integrated Results Tracking** — Automatic bet outcome tracking and P/L logging
- [ ] **Live API Integration** — SportRadar, API-Tennis (RapidAPI), The Odds API, or Flashscore scraper
- [ ] **Persistent Storage** — Save bankroll, bet history, and settings across sessions
- [ ] **Push Notifications** — Alert when high-value bets are detected
- [ ] **Historical Backtesting** — Test the edge model against past match data
- [ ] **Multi-device Sync** — Share state across devices (requires backend/database)

## API Sources for Live Data
When building the automated screener, use these:
- **SportRadar Tennis API** — Official ATP/WTA data. Premium but comprehensive.
- **API-Tennis (RapidAPI)** — Live scores, H2H, rankings. Free tier. Good for Challengers.
- **The Odds API** — Pre-match and live odds from 15+ bookmakers. Free 500 req/mo.
- **Flashscore Scraper** — Unofficial but deep. Use Puppeteer/Playwright.

## Important Rules
- Min odds filter (default 1.60) must always be respected — never recommend bets below the threshold
- Kelly fraction should default to 25% (quarter-Kelly) for bankroll protection
- All edge factors should remain tunable via the Factors tab
- The system uses fractional Kelly — never full Kelly
- Odds below min threshold should be visually struck through and excluded from recommendations
- Keep the dark terminal/hacker aesthetic — JetBrains Mono, dark backgrounds, green accents

## Code Style
- Inline styles using JavaScript objects
- Functional React with hooks (useState, useEffect)
- No external UI libraries — all custom components
- Color constants defined in the `c` object inside the App component
- Compact code style — minimize verbosity while maintaining readability
