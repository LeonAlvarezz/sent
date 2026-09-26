# Cloudflare Edge Stack (Pages, Workers, D1)

We decided to target Cloudflare's serverless edge ecosystem: Cloudflare Pages for the frontend SPA, Cloudflare Workers for the backend API, and Cloudflare D1 (serverless SQLite) with Drizzle ORM for data storage. This eliminates dedicated server/container hosting costs, provides global low latency, and runs serverless SQL without connection pooling bottlenecks.
