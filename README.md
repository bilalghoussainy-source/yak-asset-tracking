# Yak Asset Tracking

Multi-tenant asset tracking on Vercel. **Everyone signs in at the site root (`/`).** After login, **administrators** are sent to **`/admin`** (client registry, enable/disable tools, **app users**). **Client users** are sent to **`/{clientId}`** (their workspace). Data stays isolated in Supabase by key prefix (e.g. `EIAC_received`).

## URLs

| URL | What happens |
|-----|----------------|
| `https://your-app.vercel.app/` | **Login** — username + password; then redirect by role |
| `https://your-app.vercel.app/admin` | **Admin panel** — requires an **administrator** session from `/` |
| `https://your-app.vercel.app/EIAC` | **Client app** — requires a **client** session whose `clientId` is `EIAC` |

The path `admin` is reserved (not a client id). Opening `/EIAC` without a valid client session redirects to `/?next=/EIAC`.

## How users are stored

Users live in the **same** `asset_tracker` (or your `SUPABASE_TABLE`) key–value table:

| Supabase `key` | `value` (JSON string) |
|----------------|------------------------|
| `_auth_users_index` | `{"users":[{"slug":"jdoe","displayUsername":"Jane","role":"client","clientId":"EIAC"}, ...]}` — list for the admin UI (no passwords) |
| `_auth_user_<slug>` | `{"displayUsername":"...","passwordHash":"...","role":"admin"|"client","clientId":"EIAC"}` — one row per login; `passwordHash` is SHA-256 with `PORTAL_AUTH_SALT` (see app code: `:auth:` + slug + password) |

**Bootstrap admin (optional):** If `ADMIN_PASSWORD` is set in the environment at build time, you can sign in at `/` with username **`BOOTSTRAP_ADMIN_USER`** (default `admin`) and that password to get an **administrator** session **without** a row in Supabase. Use this only for first-time setup, then create real admin users under **App users** in `/admin` and rely on those.

**Legacy per-client portal:** Row `{CLIENT}_portal_creds` is still supported. If a client session is active for that URL, the extra portal step is skipped. Otherwise the old portal username/password flow still applies.

## Admin panel (`/admin`)

1. Sign in at **`/`** as an **administrator** (bootstrap or `_auth_user_*` with `role: "admin"`).
2. You are redirected to **`/admin`** automatically.
3. **App users** — add users with role *Administrator* or *Client* (set **Client ID** to the URL segment, e.g. `EIAC`).
4. **Client tools** — register clients, toggle `{CLIENT}_active`, optional `{CLIENT}_portal_creds`.
5. **Sign out** (header) clears the session and returns to **`/`**.

## Local development

1. Copy environment variables:
   ```bash
   cp .env.example .env.local
   ```
2. Fill in `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_TABLE`, `ADMIN_PASSWORD` (bootstrap), `PORTAL_AUTH_SALT`, and optionally `BOOTSTRAP_ADMIN_USER` in `.env.local`.
3. Build and serve:
   ```bash
   npm run build
   npm run dev
   ```
4. Open [http://localhost:3000/](http://localhost:3000/) to sign in, or go directly to [http://localhost:3000/admin](http://localhost:3000/admin) (you will be bounced to `/` if not signed in as admin).

## Deploy to Vercel

1. Push this repo to GitHub and import in [Vercel](https://vercel.com/new).
2. Environment variables (Production, Preview, Development):
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_TABLE`
   - `ADMIN_PASSWORD` — bootstrap admin password for `/` (optional but recommended for first login)
   - `BOOTSTRAP_ADMIN_USER` — bootstrap username (default `admin`)
   - `PORTAL_AUTH_SALT` — long random secret; **do not change** after users exist, or password hashes stop matching
3. Deploy. Share **`https://your-app.vercel.app/`** with users; they only reach **`/{client}`** after authentication.

## Supabase table

- `key` (text, primary key), `value` (jsonb or text), `updated_at` (timestamptz)

Per **client** data: `{CLIENT}_received`, `{CLIENT}_retired`, `{CLIENT}_transfers`, `{CLIENT}_audit`, `{CLIENT}_active`, optional ref rows and `{CLIENT}_portal_creds`.

**Global:** `_auth_users_index`, `_auth_user_<slug>`, `_admin_clients_registry`.

## Project structure

```
src/app.template.html   # Root login + client app by URL path
src/admin.template.html # Admin UI (session required)
scripts/build.js
dist/index.html
dist/admin/index.html
vercel.json
```

## Security notes

- The anon key, `PORTAL_AUTH_SALT`, and `ADMIN_PASSWORD` are embedded in static JS at build time. Use **RLS** on Supabase where possible and strong passwords.
- Password hashing is **SHA-256** (static hosting). Prefer long random passwords.
- Treat **`/admin`** and bootstrap credentials as internal-only.
