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

## Auth System
Login screen shown before the main app. Credentials are hardcoded:
- **Username:** `Admin`
- **Password:** `Mega2026`
- Auth state stored in `localStorage.__em_auth__` = `'1'`
- `handleLogin` / `handleLogout` in App component
- Logout button visible in header (ADMIN + LOGOUT)

## Persistent Storage (localStorage)
All state is saved to localStorage when logged in and reloaded on next login:
| Key | Contents |
|-----|----------|
| `__em_auth__` | `'1'` when logged in |
| `__em_bets__` | JSON array of betHistory |
| `__em_bankroll__` | current bankroll number |
| `__em_starting_bankroll__` | original starting bankroll |
| `__em_settings__` | settings object |
| `__em_weights__` | weights object |
| `__em_kelly__` | kellyFrac number |

## Bankroll
- Default is **0** (not 1000) — user must set it manually via header
- Header shows "SET ↗" in yellow when bankroll is 0
- Setting bankroll for first time sets both `bankroll` and `startingBankroll`
- ROI and TOTAL P/L show "–" when startingBankroll is 0

## Bets Tab
Three sections:
1. **PERFORMANCE panel** — Shows when there are manual bets or Epicbet settled bets:
   - SVG bankroll curve (full width, labeled min/max, dots at each bet)
   - Stats grid: WIN / LOSS / PENDING / ROI / AVG ODDS / STREAK
   - Recent form strip (last 10 bets as W/L colored squares)
2. **Epicbet Sync Panel** — Shows live data from Chrome extension. Open bets tab now has **match-linking**: each selection is matched against `allMatches` by player name (fuzzy last-name match), and if found shows circuit/surface badge, MODEL probability %, and EV% badge.
3. **Bet Log** — Manual bet tracking with P/L table and sparkline

## Chrome Extension (`epicbet-extension/`)
- `manifest.json` v1.1.0 — MV3, two content scripts (MAIN + ISOLATED world)
- `interceptor.js` — Runs in MAIN world, patches fetch/XHR to capture API JSON responses
- `content_epicbet.js` — ISOLATED world: listens for API events, DOM scraper for balance + bets
- `content_edgemachine.js` — Runs on edge-machine app, reads from chrome.storage.local
- Data flows: epicbet.com API → interceptor → CustomEvent → content_epicbet → chrome.storage → content_edgemachine → localStorage → React app

## Planned Features
- [ ] **Automated Screener** — Live data feed replacing MOCK_MATCHES with real API data
- [ ] **Integrated Results Tracking** — Automatic bet outcome tracking and P/L logging
- [ ] **Live API Integration** — SportRadar, API-Tennis (RapidAPI), The Odds API, or Flashscore scraper
- [x] **Persistent Storage** — Implemented via localStorage with login gate
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
