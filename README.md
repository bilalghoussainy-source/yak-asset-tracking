# Yak Asset Tracking

Multi-tenant asset tracking app hosted on Vercel. Each client gets a dedicated URL path; data is isolated in Supabase by client key prefix (e.g. `EIAC_received`, `EIAC_retired`).

## URLs

| URL | Client ID | Supabase row prefix |
|-----|-----------|---------------------|
| `https://your-app.vercel.app/EIAC` | `EIAC` | `EIAC_*` |
| `https://your-app.vercel.app/acme_corp` | `acme_corp` | `acme_corp_*` |
| `https://your-app.vercel.app/` | *(none — shows setup banner)* | — |

Client codes must be 1–64 characters: letters, numbers, `_`, or `-`.

## Local development

1. Copy environment variables:
   ```bash
   cp .env.example .env.local
   ```
2. Fill in `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_TABLE` in `.env.local`.
3. Build and serve:
   ```bash
   npm run build
   npm run dev
   ```
4. Open [http://localhost:3000/EIAC](http://localhost:3000/EIAC).

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import the repository in [Vercel](https://vercel.com/new).
3. Add environment variables (Production, Preview, Development):
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY` (or `SUPABASE_PUBLISHABLE_KEY`)
   - `SUPABASE_TABLE` (default: `asset_tracker`)
4. Deploy. Share links like `https://your-app.vercel.app/EIAC` with each client.

## Supabase setup

Table `asset_tracker` (or your `SUPABASE_TABLE`) with columns:

- `key` (text, primary key) — e.g. `EIAC_received`, `EIAC_active`
- `value` (jsonb or text)
- `updated_at` (timestamptz)

Per client, create rows:

- `{CLIENT}_received`, `{CLIENT}_retired`, `{CLIENT}_transfers`
- `{CLIENT}_audit`, `{CLIENT}_active` (set `value` to `"true"` to enable access)
- Optional ref data: `{CLIENT}_refdata_location`, `{CLIENT}_refdata_category`, `{CLIENT}_refdata_department`

## Project structure

```
src/app.template.html   # App source (client ID from URL at runtime)
scripts/build.js        # Injects Supabase env into dist/index.html
dist/index.html         # Built output (generated, not committed)
vercel.json             # SPA rewrites for /:client paths
```

## Security notes

- The Supabase **publishable/anon** key is embedded at build time (required for browser REST calls). Use Row Level Security in Supabase to restrict access.
- Clients cannot change `CLIENT_ID` in source; it is derived from the URL path only.
- Deactivate a client by setting `{CLIENT}_active` to `"false"` in Supabase.
