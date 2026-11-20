# WhaleMo

WhaleMo is a Solana intelligence dashboard for discovering profitable wallets that actively trade recent token launches. It combines period-specific trader performance, early-launch behavior, smart-money flow, and risk signals instead of ranking wallets by all-time profit or showing only established high-market-cap tokens.

Live analytics currently support Solana. Robinhood Chain integration is present as future-facing infrastructure, but its live leaderboard is disabled.

## How the app works

```text
Birdeye listings and top traders ─┐
Dexscreener live market health ───┼─> Intelligence worker ─> ClickHouse analytics
Helius wallet enrichment ─────────┘                              │
                                                                v
React/Vite client <─> Express API <─> Redis response cache
       │                    │
       │                    ├─> Supabase auth, profiles, subscriptions, watchlists
       │                    ├─> Stripe checkout, webhooks, and billing portal
       │                    └─> Alchemy/Helius balance lookup for watchlist additions
       └─> Wallet and token dashboards
```

The worker and API run separately. The worker periodically builds analytics snapshots in ClickHouse; opening the dashboard does not trigger an expensive provider backfill.

### Intelligence cycle

Each full worker cycle runs in this order:

1. **Recent launch discovery** — syncs qualifying Birdeye listings from the previous 30 days into `token_launches` and `token_analytics`.
2. **Live market health** — refreshes Dexscreener price, liquidity, market cap, and volume for recent candidates.
3. **Top-trader discovery** — evaluates healthy launches with Birdeye Top Traders, including funding metadata for wallet-quality checks.
4. **Wallet scoring** — aggregates wallet/token outcomes into 24H, 7D, 30D, and all-time wallet snapshots.
5. **Wallet enrichment** — uses Helius to attach current Solana balances and token counts to selected candidates.
6. **Token scoring** — recalculates alpha scores from established smart-wallet participation and live market health.

Dexscreener health also refreshes independently every 15 minutes so rugged tokens fall out of rankings between full pipeline runs. ClickHouse checkpoints prevent unchanged top-trader cohorts from being requested every cycle.

### Wallet smart score

Wallets are evaluated within the selected period. Eligibility gates require minimum period profit and trade activity, so an old all-time gain cannot hide current losses. The score considers:

- Launch-specific win rate and a conservative Wilson lower bound.
- Median ROI with extreme returns bounded to reduce outlier manipulation.
- Realized profit quality and current activity.
- Early entry into qualifying launches.
- Breadth across distinct young tokens.
- Concentration and suspicious-behavior penalties.

Developer, bundler, insider, and sniper-tagged traders are excluded from Birdeye cohorts. Fresh wallets — newly funded, Birdeye-tagged `fresh`, or observed only on a single launch — cannot count as qualified buyers.

### Token alpha score

Tokens are discovered from recent Birdeye listings and must pass live Dexscreener health checks before ranking. Alpha is hard-zeroed when market health is stale/failed, current liquidity or market cap is below floors, there are fewer than two established qualified buyers, smart flow is non-positive, or fresh wallets dominate buying. Eligible scores combine:

- Launch recency.
- Breadth and quality of established smart-wallet buyers.
- Positive smart-money net flow.
- Smart-wallet buy acceleration.
- Live liquidity.
- Concentration and fresh-wallet penalties.

## Product features

### Smart wallets

`/wallets` provides a sortable, paginated leaderboard for 24H, 7D, 30D, and all-time periods. Each row shows smart score, profit, win rate, balance, trading activity, holdings, and volume.

- Hover the wallet address to add it to the watchlist.
- Click the rest of the row to open `/wallets/:address`.
- Colored wallet avatars use a wallet icon for consistent identification.

### Wallet analysis

`/wallets/:address` provides:

- Period-specific performance and leaderboard rank.
- Period profit, realized/unrealized PnL, win rate, alpha tokens, trades, and volume. The smart score is not surfaced here; it remains a leaderboard ranking signal.
- Trading profile, concentration, and risk flags.
- Up to 50 launch-token positions with PnL, ROI, timing, and token alpha context.
- A watchlist action from the analysis page.

When a complete leaderboard snapshot is unavailable, the endpoint can return position-only coverage.

### Alpha tokens

`/tokens` ranks recent launches by alpha score using live Dexscreener market data and exposes liquidity, age, market cap, price change, volume, qualified buyers, and smart-money flow. Contract addresses open the token's Dexscreener page.

### Watchlist

`/watchlist` stores personal wallets in Supabase and enriches their cards from the latest 7D ClickHouse analytics.

- Cards show balance, 7D PnL, win rate, and last activity.
- Newly added wallets refresh immediately without a hard reload.
- Hover a wallet name to reveal an inline rename control.
- Hover a card to reveal a remove control, which asks for confirmation before deleting.
- Personal names are persisted to Supabase.

Watchlist membership is owned by Supabase, not ClickHouse. A wallet whose analytics have been wiped from `wallet_analytics` stays on the watchlist and remains renameable and removable; its metrics render as no data rather than as zeros, so an absent snapshot is never mistaken for a wallet that lost everything.

### Authentication and billing

Supabase provides email/password authentication. Stripe provides Starter and Pro checkout, webhook-driven subscription state, and customer portal access. Dashboard routes require an `active` or `trialing` subscription.

The frontend currently stores the Supabase access token locally. Expired sessions require signing in again; automatic refresh-token handling is not yet implemented.

## Application routes

- `/` — public landing page.
- `/login` and `/signup` — authentication.
- `/pricing` and `/pricing/success` — plan selection and checkout completion.
- `/billing` — subscription details and Stripe portal access.
- `/wallets` — smart-wallet leaderboard.
- `/wallets/:address` — dedicated wallet analysis.
- `/tokens` — recent-launch alpha leaderboard.
- `/watchlist` — personal tracked wallets.

## Backend API

All protected dashboard endpoints require a bearer token and an entitled subscription.

- `GET /api/health`
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `PATCH /api/auth/me`
- `GET /api/billing/subscription`
- `POST /api/billing/checkout`
- `POST /api/billing/portal`
- `GET /api/billing/session/:sessionId`
- `POST /api/billing/webhook`
- `GET /api/wallets/top`
- `GET /api/wallets/:address`
- `GET /api/tokens/top`
- `GET /api/watchlist`
- `POST /api/watchlist`
- `PATCH /api/watchlist/:id`
- `DELETE /api/watchlist/:id?chain=`

Leaderboard endpoints support `chain`, `period`, pagination, sort key, and sort order parameters. Live leaderboard requests accept Solana; unsupported live chains return no analytics.

## Data storage

### ClickHouse

- `wallet_analytics` — period-aware wallet leaderboard snapshots.
- `token_analytics` — period-aware token snapshots and alpha signals.
- `token_launches` — recent launch metadata.
- `token_market_health` — live Dexscreener price, liquidity, market cap, volume, and health flags.
- `wallet_token_performance` — wallet outcomes for each launch token and period, including funding age and trader tags.
- `wallet_token_trades` — normalized trade facts with a 90-day TTL; retained for optional Helius trade ingestion.
- `worker_checkpoints` — provider refresh and backfill cursors.

### Supabase

- `profiles` — display name and default chain.
- `subscriptions` — plan, status, Stripe identifiers, and billing period.
- `watchlist_wallets` — user-owned wallet addresses and custom names.

### Redis

Redis caches API responses. It is not used as the worker queue.

## Quick start

### Requirements

- Node.js and Yarn.
- ClickHouse.
- Redis.
- Supabase, Birdeye, Helius, and Stripe credentials for live mode.

### Backend API

```bash
cd backend
cp .env.example .env
yarn install
yarn dev
```

The API defaults to `http://localhost:3001`.

### Intelligence worker

Run this as a separate process:

```bash
cd backend
yarn worker
```

Set `WORKER_ENABLED=false` to disable ingestion without removing analytics data.
The default full-pipeline interval is two hours (`TOKEN_SYNC_INTERVAL_MINUTES=120`), while
market-health checks continue every 15 minutes.

### Frontend

```bash
cd frontend
cp .env.example .env
yarn install
yarn dev
```

Vite normally starts on port 5173 and proxies `/api` to port 3001. The checked-in backend environment example also allows port 5175 for local setups. Set `VITE_API_URL` when the API is hosted separately.

## Database setup

### New ClickHouse database

Run `backend/sql/clickhouse/schema.sql`. The baseline contains the complete current schema, so
do not run the historical migrations afterward on a fresh database.

### Existing ClickHouse database

Apply these migrations in order:

Apply the unapplied files in numeric order from `backend/sql/clickhouse/migrations/` (currently
002 through 012). Migration 005 introduces the alpha intelligence fact tables, migration 006
adds live market-health and wallet-quality data, migrations 007–011 add the current evidence,
holder-wealth, completeness, churn, and qualified-wallet fields, and migration 012 adds token images.

### Supabase

1. Create a Supabase project.
2. Add the project URL, anon key, and service-role key to `backend/.env`.
3. For a new project, run `backend/sql/supabase/schema.sql` in the Supabase SQL Editor.
4. For an existing project, apply the unapplied files in numeric order from
   `backend/sql/supabase/migrations/`.
5. Set `DEMO_MODE=false`.

See `backend/sql/README.md` for the complete directory layout and migration rules.

## Stripe setup

1. Create recurring Starter and Pro products and copy their price IDs into `STRIPE_PRICE_STARTER` and `STRIPE_PRICE_PRO`.
2. Add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`.
3. Enable the Stripe customer portal.
4. Forward local webhooks:

```bash
stripe listen --forward-to localhost:3001/api/billing/webhook
```

Checkout flows from `/pricing` to Stripe and then `/pricing/success`. Billing management opens the Stripe customer portal.

## Demo mode

Set `DEMO_MODE=true`, or leave Supabase credentials unset, to use backend in-memory authentication and mock dashboard data. Set the frontend `VITE_DEMO_MODE` consistently. Demo state resets when the backend process restarts.

## Provider usage and rate limits

The testing defaults scan 10 tokens for 24H and 7D cohorts, 30 tokens for the weekly 30D cohort, and refresh listings every two hours. Top Traders request holder net-worth metadata so fresh/funded wallets can be filtered without Helius history scans. Monitor Birdeye usage after changing the pipeline interval because more frequent discovery cycles increase compute-unit consumption.

- Dexscreener batched health checks refresh every 15 minutes and do not consume Birdeye CU.
- Birdeye requests are serialized and retried conservatively on rate limits.
- Helius calls are serialized for free-tier Enhanced API limits and use exponential backoff.
- ClickHouse requests retry transient network, timeout, and TLS failures.
- Adjust `ALPHA_TOP_TRADER_*`, `ALPHA_MIN_*`, `TOKEN_MIN_*`, `DEXSCREENER_REFRESH_INTERVAL_MINUTES`, and `TOKEN_SYNC_INTERVAL_MINUTES` to fit your quotas.

## Development commands

Backend:

```bash
yarn dev       # watch the Express API
yarn worker    # run the intelligence worker
yarn test      # scoring and Helius parser tests
yarn build     # compile TypeScript
yarn start     # run compiled API
```

Frontend:

```bash
yarn dev
yarn lint
yarn build
yarn preview
```

Run commands from the relevant `backend` or `frontend` directory; there is no root package script.

## Deployment notes

- Deploy the static Vite frontend to Netlify using `netlify.toml`.
- Deploy the Express API and intelligence worker as separate Railway services using the two
  configuration files under `backend/`.
- Keep the worker private, disable sleeping, and run exactly one replica.
- Configure `VITE_API_URL`, CORS, `FRONTEND_URL`, and provider credentials for the deployed domains.
- Run migrations before starting the worker.

See [DEPLOYMENT.md](DEPLOYMENT.md) for the exact service settings, environment variables, and
post-deployment checks.

## Current limitations

- Live leaderboard analytics are Solana-only.
- Access tokens are not automatically refreshed.
- Plan-specific marketing limits are not yet enforced by the API.
- Helius trade-ingestion utilities exist, but the active pipeline uses Birdeye Top Traders for wallet/token performance.
- No notification or wallet-alert worker is currently implemented.

See [CHANGELOG.md](CHANGELOG.md) for the implementation history.

## License

WhaleMo is released under the [MIT License](LICENSE).

Secrets never belong in the repository: copy `backend/.env.example` and `frontend/.env.example`
to `.env` in the same folders and fill in your own keys. Both `.env` files are git-ignored.
