# Deployment

The production layout uses three isolated processes:

```text
Netlify frontend  --->  Railway API  --->  Supabase / ClickHouse / Redis
                              ^
Railway worker  ----------------+
```

The API never starts the worker. The worker has no public domain and runs as a Railway
cron job every two hours.

## 1. Railway API

Create a Railway service from this repository with these settings:

- Root directory: `/backend`
- Config file: `/backend/railway-api.toml`
- Public domain: enabled
- Replicas: one initially
- Serverless/app sleeping: optional for the API

Set these variables in Railway. Copy provider values from your local `backend/.env`; never commit
the real values.

```dotenv
NODE_ENV=production
DEMO_MODE=false
WORKER_ENABLED=false
FRONTEND_URL=https://YOUR-SITE.netlify.app
CORS_ORIGIN=https://YOUR-SITE.netlify.app

SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
REDIS_URL=
CLICKHOUSE_URL=
CLICKHOUSE_DATABASE=nodex
CLICKHOUSE_USER=
CLICKHOUSE_PASSWORD=
ALCHEMY_API_KEY=
```

Railway supplies `PORT`; do not hard-code it. After deployment, verify:

```text
https://YOUR-API.up.railway.app/api/health
```

## 2. Railway worker (cron job)

Create a second Railway service from the same repository:

- Root directory: `/backend`
- Config file: `/backend/railway-worker.toml`
- Public domain: disabled

The config makes this a Railway cron job. Every two hours (`0 */2 * * *`, UTC) Railway starts the
worker, it runs the whole pipeline once and exits. Do not run it as an always-on service: a worker
that waits between runs on a timer makes no network calls while idle, so Railway's app sleeping
puts it to sleep and nothing wakes it again. It then runs once per deploy and never again.

Set the database and provider variables from `backend/.env`, plus:

```dotenv
NODE_ENV=production
DEMO_MODE=false
WORKER_ENABLED=true
TOKEN_SYNC_INTERVAL_MINUTES=120
DEXSCREENER_REFRESH_INTERVAL_MINUTES=0
BIRDEYE_MIN_INTERVAL_MS=100
SYNC_CHAINS=solana,robinhood
BLOCKSCOUT_API_KEY=
FOMO_API_KEY=
```

`FOMO_API_KEY` is needed for Robinhood Chain on the wallets page. FOMO submits its users'
Robinhood trades through a relayer, so their wallets never send the swaps and per-wallet swap
history misses them. The worker reads FOMO's trade feed instead: two calls a run, about 90,000 of
the free plan's 250,000 monthly credits.

`BLOCKSCOUT_API_KEY` supplies Robinhood Chain token holder counts, which Birdeye does not have for
that chain and the churn screen divides by. Without it the worker skips Robinhood token discovery
and logs why. Leave `robinhood` out of `SYNC_CHAINS` to run Solana only.

### Monthly: refresh the tracked traders

The wallets page follows FOMO's top 250 traders. Their wallets are saved in
`backend/src/data/fomo-top-traders.json`, which ships with the code. Once a month, locally with
`FOMO_API_KEY` in `backend/.env`:

```bash
cd backend
npm run fomo:refresh
git add src/data/fomo-top-traders.json && git commit -m "Refresh FOMO top traders"
```

Then redeploy the worker. It picks up the new list on its next run. The refresh costs 1,000 of
the free plan's 250,000 monthly FOMO credits, and the worker logs a warning once the saved list is
more than 35 days old.

`TOKEN_SYNC_INTERVAL_MINUTES` must match the cron interval, because the site's "next update"
countdown is computed from it. `BIRDEYE_MIN_INTERVAL_MS=100` suits the Birdeye Lite plan (15
requests per second). Use about 1000 on the free plan.

ClickHouse Cloud bills compute while the service is awake and idles it after a quiet period. A run
takes about 15 minutes, so ClickHouse is awake for roughly 20 minutes of every two hours.

## 3. Netlify frontend

Create a Netlify site from this repository. The Netlify configuration supplies the base directory,
build command, publish directory, Node version, security headers, and SPA fallback. A `_redirects`
file is also copied into the published assets so direct visits to React routes never return a 404.

Set these build-time variables in Netlify:

```dotenv
VITE_API_URL=https://YOUR-API.up.railway.app/api
VITE_DEMO_MODE=false
VITE_SUBSCRIPTIONS_ENABLED=false
```

Deploy the Railway API first so its URL is available when Netlify builds the frontend. If the
Netlify domain changes, update `FRONTEND_URL` and `CORS_ORIGIN` on the Railway API and redeploy it.

## Deployment checks

1. Open the Railway `/api/health` URL and confirm a JSON `ok` response.
2. Open a nested frontend route directly, such as `/tokens`, and confirm Netlify serves the app.
3. Log in and confirm API requests target the Railway domain.
4. Confirm the worker's cron runs log `Mode: single run` and `pipeline completed`, and exit.
5. Confirm the API service logs do not contain worker startup messages.
