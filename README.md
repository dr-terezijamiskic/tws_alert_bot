# Exit-First Trading Copilot

## Read this before trading (why this app exists)

This app is my system, externalized.

It does NOT tell me what to think.
It only reminds me what I already decided when I was calm.

### What this app is
- A discipline tool for exits and risk reduction
- A loud alarm only when my invalidation is touched
- A journal that shows me whether I followed my own rules

### What this app is NOT
- Not financial advice
- Not an auto-trading bot
- Not a “close early” machine
- Not allowed to force exits except on invalidation

## My Rule Cards (v1)

### Rule 1 — Invalidation = Exit (non-negotiable)
If price touches my invalidation level, my setup is broken.
I exit immediately. No waiting.

### Rule 2 — Chop = Reduce 50% (optional, quiet)
If price is flat / stuck / choppy and not expanding, reducing 50% is an option.

### Rule 3 — No follow-through = Reduce 50% (optional, quiet)
If enough candles pass and price makes no attempt to move in my direction,
reducing 50% is an option.

### Rule 4 — Uncertainty = Reduce 50% (optional, quiet)
If I feel unsure about structure or direction, reducing 50% is an option.

### Rule 5 — Capital protection is a win
Reducing risk or exiting early is doing my job.
Preserving capital matters more than being right.

## Alarm rules
- Sound + escalation happen ONLY on `EXIT_NOW` (invalidation touched).
- Reduce suggestions are ALWAYS quiet (visual only).
- Trades never auto-close. I decide.

A manual-first trading discipline tool built with Next.js 14, TypeScript, and SQLite. This MVP helps traders enforce their exit rules through a pre-trade contract system, real-time invalidation alerts, and comprehensive trade journaling.

## Features

- **Pre-Trade Contract**: Define your setup, invalidation price, and commit before entering
- **Live Trade Monitor**: Real-time price updates with automatic invalidation detection
- **Exit-Now Alarm**: Loud, repeating alerts when invalidation price is touched
- **Override System**: Requires written justification to ignore invalidation signals
- **Reduce Suggestions**: Quiet prompts for choppy/uncertain price action
- **Trading Journal**: Review all trades with key discipline metrics
- **Offline-First**: Works completely locally with SQLite persistence

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Database**: SQLite with better-sqlite3
- **Styling**: Tailwind CSS (dark theme, big typography)
- **Runtime**: Node.js

## Installation

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Setup Steps

1. **Navigate to the project directory**:
   ```bash
   cd exit-trading-copilot
   ```

2. **Install dependencies** (if not already installed):
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

The database will be automatically created in the `data/` directory on first run.

## Usage Guide

### 1. Creating a New Trade (`/new`)

1. Navigate to "New Trade" in the navigation bar
2. Fill out the pre-trade contract:
   - **Ticker**: Stock/asset symbol (e.g., SPY, AAPL)
   - **Direction**: LONG (call) or SHORT (put)
   - **Setup/Thesis**: Why you're taking this trade
   - **Timeframe**: Chart timeframe (5m, 15m, 1h, etc.)
   - **Invalidation Price**: Your stop loss level
   - **Notes**: Optional additional context
3. Click **I'M IN** to create the trade
4. You'll be immediately redirected to the live monitor

### 2. Monitoring an Active Trade (`/trade/[id]`)

#### Normal Monitoring:
- Enter current price in the "Price Update" section
- Check boxes for current conditions:
  - **Chop**: Choppy, sideways price action
  - **Unsure**: Uncertain about price direction
  - **In Profit**: Currently profitable
- Click "Update Price"

#### When Chop/Unsure is Detected:
- A quiet yellow suggestion appears: "Consider reducing position"
- Click **REDUCE 50%** to log a partial exit (for journaling)

#### When Invalidation is Triggered:
1. If price touches invalidation level:
   - **LONG**: price ≤ invalidation price
   - **SHORT**: price ≥ invalidation price
2. Trade status changes to **EXIT_NOW**
3. Loud, repeating alarm starts (880Hz tone every 2 seconds)
4. Screen shows red alert banner
5. Only two buttons appear:
   - **EXIT**: Close the trade and stop the alarm
   - **OVERRIDE**: Requires one-sentence justification

#### Overriding Invalidation:
1. Click **OVERRIDE**
2. Enter a clear reason (e.g., "false breakout, support held")
3. Click "Confirm Override"
4. Trade returns to ACTIVE status, alarm stops
5. Override is logged for later review

#### Exiting a Trade:
1. Click **EXIT** button
2. Trade status changes to CLOSED
3. Redirected to review page
4. Trade duration and metrics are calculated

### 3. Reviewing Performance (`/review`)

The review page shows:

#### Metrics Dashboard:
- **Total Trades**: Number of trades created
- **Avg Exit Delay**: Average time from EXIT_NOW trigger to EXIT action
- **EXIT_NOW Ignored >60s**: Percentage of invalidations ignored for over 60 seconds
- **Rule Violations**: Count of invalidations ignored beyond 60 seconds
- **Avg Reduces/Trade**: Average number of REDUCE actions per trade
- **Avg Hold Time**: Average duration trades are held (in minutes)

#### Trade Journal Table:
- List of all trades with key details
- Click "Monitor" to return to active trades
- Click "View" to see closed trade details

## Project Structure

```
exit-trading-copilot/
├── app/
│   ├── layout.tsx              # Root layout with nav
│   ├── page.tsx                # Home (redirects to /review)
│   ├── globals.css             # Global styles
│   ├── new/
│   │   └── page.tsx           # Pre-Trade Contract form
│   ├── trade/
│   │   └── [id]/
│   │       └── page.tsx       # Live Monitor with alarm logic
│   ├── review/
│   │   └── page.tsx           # Journal and metrics
│   └── api/
│       ├── trades/            # Trade CRUD endpoints
│       ├── price-updates/     # Price update endpoint
│       ├── actions/           # Action logging endpoint
│       └── metrics/           # Metrics calculation endpoint
│
├── lib/
│   ├── db/
│   │   ├── index.ts           # Database connection
│   │   ├── schema.ts          # Table schemas
│   │   └── queries.ts         # Query functions
│   └── types.ts               # TypeScript type definitions
│
├── components/
│   └── nav.tsx                # Navigation component
│
├── data/
│   └── trades.db              # SQLite database (auto-created)
│
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── README.md
```

## Database Schema

### `trades` table:
```sql
id                  INTEGER PRIMARY KEY
createdAt           TEXT (ISO datetime)
ticker              TEXT
direction           TEXT ('LONG' | 'SHORT')
setup               TEXT
timeframe           TEXT
invalidationPrice   REAL
entryTime           TEXT (ISO datetime)
status              TEXT ('ACTIVE' | 'EXIT_NOW' | 'CLOSED')
closedAt            TEXT (nullable)
notes               TEXT (nullable)
exitNowTriggeredAt  TEXT (nullable, tracks first EXIT_NOW trigger)
```

### `price_updates` table:
```sql
id          INTEGER PRIMARY KEY
tradeId     INTEGER (foreign key)
time        TEXT (ISO datetime)
price       REAL
chop        INTEGER (0/1 boolean)
unsure      INTEGER (0/1 boolean)
inProfit    INTEGER (0/1 boolean)
statusAfter TEXT ('ACTIVE' | 'EXIT_NOW' | 'CLOSED')
reason      TEXT (nullable)
```

### `actions` table:
```sql
id       INTEGER PRIMARY KEY
tradeId  INTEGER (foreign key)
time     TEXT (ISO datetime)
type     TEXT ('EXIT' | 'REDUCE' | 'NOTE' | 'OVERRIDE')
payload  TEXT (JSON string with action details)
```

## Key Behaviors

### Invalidation Logic:
- **LONG trades**: EXIT_NOW triggers when `price <= invalidationPrice`
- **SHORT trades**: EXIT_NOW triggers when `price >= invalidationPrice`

### Alarm System:
- Plays 880Hz sine wave tone for 0.5 seconds
- Repeats every 2 seconds while in EXIT_NOW status
- Uses Web Audio API (works in all modern browsers)
- Stops when trade is exited or overridden

### Metrics Calculations:
- **Avg Exit Delay**: Time difference between `exitNowTriggeredAt` and first EXIT action
- **EXIT_NOW Ignored >60s**: Percentage of trades where delay > 60 seconds
- **Rule Violations**: Count of delays > 60 seconds
- **Avg Reduces/Trade**: Total REDUCE actions / total trades
- **Avg Hold Time**: Average of `(closedAt - entryTime)` for closed trades

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Database Management

The SQLite database is stored in `data/trades.db` and is automatically created on first run.

**To reset the database** (delete all trades):
```bash
rm data/trades.db
```

The database will be recreated with empty tables on next run.

## Browser Requirements

- Modern browser with Web Audio API support (Chrome, Firefox, Safari, Edge)
- JavaScript enabled
- LocalStorage access (for Next.js)

## Design Philosophy

This tool is designed to enforce **trading discipline** through:

1. **Pre-commitment**: Define your plan before entering
2. **Objective invalidation**: No wiggle room on stop loss
3. **Forced accountability**: Override requires written justification
4. **Immediate feedback**: Loud alarm creates urgency
5. **Performance tracking**: Metrics reveal discipline patterns

The UI is intentionally **minimal and bold** to reduce cognitive load during high-stress trading situations.

## Future Enhancements (Not in MVP)

- Export trades to CSV
- Charts for price history
- P&L tracking
- Custom alarm sounds
- Multiple position sizes
- Trade tags/categories
- Win rate calculations
- Automatic backup system

## License

MIT

## Support

For issues or questions, please review the code structure and inline comments. All core logic is documented in the source files.

---

**Remember**: This tool enforces discipline, but you must execute the exits yourself. No automation can replace proper risk management and emotional control.
