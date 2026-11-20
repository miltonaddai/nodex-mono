# Changelog

All notable changes to NodeX are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). The project has not assigned a release version to the current work, so it is grouped under **Unreleased**.

## [Unreleased] - 2026-08-02

### Added

#### Solana alpha intelligence

- Added a recent-launch intelligence pipeline focused on tokens listed within the previous 30 days.
- Added Birdeye recent-listing discovery with configurable age, liquidity, volume, holder, and market-cap filters.
- Added Birdeye token Top Traders ingestion for 24H, 7D, and 30D cohorts.
- Added period-specific wallet/token performance aggregation.
- Added a wallet smart score based on launch win rate, median ROI, realized profit quality, early entry, activity, and diversification.
- Added strict eligibility gates for minimum period profit, trades, and distinct young tokens.
- Added concentration and suspicious-behavior penalties.
- Added developer, bundler, and insider trader exclusions.
- Added a token alpha score based on recency, smart-wallet buyer quality, net smart-money flow, buy acceleration, liquidity, and risk.
- Added configurable worker checkpoints and cohort refresh windows to control provider usage.
- Added Helius enhanced-transaction pagination, swap normalization, and deterministic trade identities for optional trade ingestion.

#### ClickHouse data model

- Added `token_launches` for recent listing metadata.
- Added `wallet_token_trades` for normalized trade facts with a 90-day TTL.
- Added `wallet_token_performance` for wallet outcomes by token and period.
- Added `token_market_health` for live Dexscreener market checks.
- Added `worker_checkpoints` for resumable provider refreshes.
- Added smart score, young-token activity, ROI, realized/unrealized profit, concentration, and risk fields to `wallet_analytics`.
- Added launch time, token age, alpha score, smart buyers, smart-money flow, acceleration, and risk fields to `token_analytics`.
- Added qualified/fresh buyer fields and wallet funding metadata for quality gates.
- Added migrations `005-alpha-intelligence.sql` and `006-token-quality-gates.sql`, and synchronized the main ClickHouse schema.

#### Token quality gates

- Added batched Dexscreener market-health refreshes every 15 minutes.
- Added hard alpha-score zeros for unhealthy markets, stale health, thin established buyers, non-positive smart flow, and fresh-wallet domination.
- Added Birdeye funding/net-worth metadata and fresh-wallet classification for top traders.
- Added API filtering that joins fresh healthy Dexscreener snapshots into token rankings.

#### Wallet analysis

- Added `GET /api/wallets/:address` for authenticated wallet analysis.
- Added a dedicated `/wallets/:address` frontend route.
- Added period-aware wallet summaries, ranking, profitability, trading profile, and risk review.
- Added launch-token positions with ROI, PnL, timing, and token alpha context.
- Added position-only fallback coverage when a complete leaderboard snapshot is unavailable.
- Added defensive handling for positions with unavailable contracts.

#### Watchlist experience

- Added hover-to-watchlist controls beside wallet addresses in the smart-wallet table.
- Added loading and already-watched states for the watchlist action.
- Added immediate watchlist refresh after adding a wallet.
- Added ClickHouse enrichment for watchlist balance, 7D PnL, win rate, and last activity.
- Added inline custom wallet naming on watchlist cards.
- Added `PATCH /api/watchlist/:id` to persist personal wallet names.
- Added save, cancel, Enter, and Escape interactions for inline wallet-name editing.
- Added wallet icons to colored wallet-table avatars.
- Added wallet removal from watchlist cards, gated behind an inline confirmation step.
- Added a `chain` parameter to `DELETE /api/watchlist/:id`.
- Added an explicit "no analytics data yet" card state for watchlist wallets with no `wallet_analytics` row.

#### Billing and subscriptions

- Added Stripe Starter and Pro checkout support.
- Added Stripe webhook-driven subscription persistence.
- Added checkout-session verification and Stripe customer portal access.
- Added subscription-aware frontend and backend route guards.
- Added billing and checkout-completion pages.

#### Testing and documentation

- Added scoring and Helius parser tests.
- Added a Birdeye v3 smoke-test script.
- Added Node type references for standalone backend scripts.
- Expanded the README with architecture, scoring, routes, APIs, storage, setup, migrations, provider usage, deployment, and current limitations.
- Added this changelog.

### Changed

#### Ranking and discovery

- Replaced generic high-market-cap token discovery with recent-launch discovery.
- Replaced global wallet-gainer ranking with launch-specific, period-aware profitability.
- Replaced Helius-based performance ingestion in the active worker path with Birdeye Top Traders to reduce API load and improve period accuracy.
- Changed wallet leaderboard defaults to sort by smart score.
- Changed token leaderboard defaults to sort by alpha score.
- Added alpha score, liquidity, and age columns to the token table.
- Corrected period-specific token price-change and volume field selection.
- Added zero-score tombstones so wallets that become ineligible no longer remain active in rankings.

#### Worker orchestration

- Reordered the active worker cycle to sync top traders, recent tokens, wallet rankings, and token scores in dependency order.
- Cached Helius wallet enrichment across periods during each worker cycle.
- Reduced testing backfill size and tokens-per-run to respect free-tier provider limits.
- Increased the 30D token cohort to improve profitable-wallet discovery.
- Changed the default token/listing worker interval from eight hours to two hours.
- Lowered the initial distinct-token requirement to allow profitable single-launch traders while the dataset grows.

#### Frontend behavior

- Made wallet table rows navigable to detailed wallet analysis.
- Extended frontend API types for wallet summaries, positions, period breakdowns, and coverage.
- Updated dashboard state defaults for smart-score and alpha-score sorting.
- Updated wallet cards from mock-index enrichment to address-matched ClickHouse analytics.
- Added consistent pointer cursors for enabled links, buttons, controls, and ARIA-based interactive elements.
- Linked wallet addresses to Solscan and token contracts to Dexscreener with hover underlines.

### Removed

- Removed the smart score stat from the wallet analysis page. The score is still computed, still sortable on the wallet leaderboard, and still gates alpha selection.
- Removed the decorative star icon from watchlist cards.

### Fixed

- Fixed watchlist cards requiring a hard refresh before analytics appeared after adding a wallet.
- Fixed watchlist additions initially showing zero PnL and win rate when ClickHouse analytics were available.
- Fixed token ages being frozen at their stored snapshot value; ages now derive from launch timestamps and show hours when under one day.
- Fixed wallet detail ClickHouse alias syntax by placing aliases before `FINAL`.
- Fixed wallet analysis crashes when a position contract was missing.
- Fixed smart wallets being selected from all-time gains despite losses in the requested period.
- Fixed ClickHouse interval parameter syntax by using `toIntervalDay`.
- Fixed Helius free-tier `429 Too Many Requests` failures with serialized throttling and exponential backoff.
- Fixed redundant Helius throttling in wallet transaction retrieval.
- Fixed Birdeye retry behavior and serialized requests to reduce compute-unit and rate-limit pressure.
- Fixed transient ClickHouse timeout, TLS, socket, and network failures with request timeouts and exponential retries.
- Fixed missing Node typings in `backend/scripts/test-birdeye-v3.ts`.
- Fixed watchlist cards presenting join placeholders as measured analytics. A wallet whose `wallet_analytics` row has been wiped stays on the watchlist, but now renders as no data rather than a real-looking $0 balance, $0 PnL, and 0% win rate.
- Fixed watchlist edits being discarded in demo mode. Removing or renaming a seeded mock wallet had no effect because the mock list was never materialized; edited chains are now authoritative and emptying a watchlist no longer resurrects the mocks.

### Security and reliability

- Added authenticated and subscription-gated wallet detail and watchlist mutation endpoints.
- Scoped persisted watchlist renames and removals to the authenticated user.
- Added server-side wallet-name trimming and a 64-character limit.
- Added idempotent worker checkpoints to avoid unnecessary repeated provider calls.
- Added cache-version-aware analytics responses so ranking-model changes become visible promptly.

### Provider budget defaults

- Birdeye calls are serialized at a conservative cadence.
- Helius calls are serialized for free-tier Enhanced API limits.
- Top-trader cohorts refresh independently by period.
- The testing configuration targets approximately 25,250 Birdeye compute units per month before retries.

### Known limitations

- Live analytics currently support Solana only.
- Frontend Supabase access tokens are not automatically refreshed; an expired session requires another login.
- Starter and Pro marketing limits are not yet enforced per feature in the backend.
- Helius trade-ingestion utilities are available but are not part of the active worker cycle.
- Alerts and notifications are not yet implemented.
