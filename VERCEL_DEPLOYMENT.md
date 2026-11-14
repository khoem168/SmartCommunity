# Vercel Services deployment

Import `khoem168/SmartCommunity` as **one project**, with the repository root
(`.`) as Root Directory. The root `vercel.json` owns the four services. Clear
old project-level frontend build/output overrides; each service defines its own
build settings. Do not select `frontend_user` as the project root for this mode.

## Confirmed routing

| Service | Public routes | Purpose |
| --- | --- | --- |
| `backend` | `/api`, `/api/*`, `/socket.io`, `/socket.io/*`, `/uploads`, `/uploads/*`, `/health` | API, WebSocket upgrades, legacy upload URLs, health |
| `frontend_admin` | `/admin-console`, `/admin-console/*` | Separate administrator SPA and its assets |
| `frontend_user` | All remaining paths, including `/` and `/admin` | Main website and its existing embedded administration page |
| `telegram_bot` | None | Unused internal payment-alert service |

More specific routes precede the website catch-all. Backend paths retain their
prefixes: Express already mounts its API under `/api`. Admin route lookup strips
`/admin-console` to find built files; the browser keeps the public prefix, which
matches the Vite base and React Router basename. Both SPAs have service-scoped
`index.html` fallbacks for deep links.

The frontend subdirectories retain standalone Vercel configuration files, but
the root configuration explicitly includes the settings needed by Services mode.

## Calls and bindings

Both frontends are static Vite applications. Their JavaScript runs in the
browser and calls the public `/api` route; `frontend_user` also connects to
`/socket.io`. They cannot consume function-only runtime bindings.

There are currently **no server-to-server calls between these four services**,
so no bindings are declared. The user requested that `telegram_bot` remain
internal and unused. Backend calls to MySQL, email, Firebase, Cloudinary and
Bakong are external integrations, not services in this repository.

If a future feature connects the backend to Telegram, declare the binding on
`backend` and read the injected URL in backend runtime code. Do not add a public
Telegram alert route, do not expose a binding as a `VITE_*` value, and do not
manually set a binding variable.

## Environment

Set shared project environment variables in Vercel, with appropriate values for
Production and Preview. Use `backend/.env.example` as the variable inventory.

- `NODE_ENV=production`
- Hosted MySQL/MariaDB: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`,
  and `DB_SSL_CA` if the provider requires a CA. Import the schema and run
  migrations separately; the local Compose database is not deployed by Vercel.
- `JWT_SECRET`: a unique random secret with at least 32 characters.
- `CLIENT_URL`: the exact public HTTPS origin(s), comma-separated.
- `APP_URL`: the public website HTTPS origin for email and notification links.
- `API_PUBLIC_URL`: the same public HTTPS origin for generated media URLs.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: required
  for durable uploads on Vercel. Existing local `backend/uploads` files are not
  transferred; migrate any media you need separately. Function filesystems are
  not persistent upload storage, and Express static serving is not supported.
- Configure the email provider, Google sign-in, Firebase and Bakong variables
  for the features you use, as documented in `backend/.env.example`.
- Telegram credentials are optional while the internal service remains unused.
  If enabled later, configure `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`.

Leave `VITE_API_URL` unset (defaults to `/api`) or explicitly set `/api`. Leave
`VITE_SOCKET_URL` unset (uses the API origin). Remove old localhost or separately
hosted backend overrides when using the single-domain deployment. Vite values
are embedded at build time, so changes require a rebuild. Never put database
credentials, JWT secrets, or Telegram tokens in `VITE_*` variables.

Do not set a project-wide `PORT`; Vercel assigns service ports. The standalone
defaults are backend 4000, Telegram 4001, user Vite 5173 and admin Vite 5174.

## Local verification

From the repository root, use a current Vercel CLI with Services support:

```sh
npx vercel@latest dev --local --listen 3100
```

`vercel dev` is also supported when linked to your Vercel project. The local
mode avoids linking or publishing. Supply local backend environment values for
database-backed features; keep test secrets out of Git.

Check `/`, a frontend deep link such as `/courses`, `/admin-console/`, an admin
deep link such as `/admin-console/users`, and `/health`. Check that admin assets
load under `/admin-console/assets/`, unauthenticated `/api/auth/me` returns JSON
with HTTP 401, and unknown API routes return JSON 404 rather than frontend HTML.
`/alert/payment-success` must not invoke the internal Telegram service publicly.

Independent build/test checks:

```sh
npm --prefix frontend_user run build
npm --prefix frontend_admin run build
npm --prefix backend test
node --test tests/vercel-services.test.cjs
```

## Runtime limits

Local validation passed for both frontend production builds, backend tests, and
five service smoke tests. Vercel CLI 65.16.0 detected all four services, but its
local development startup was blocked by Windows denying symbolic-link creation
in the CLI builder cache. Full Vercel ingress routing still needs verification
in an environment where the CLI can start, or in a preview deployment.

The backend exports its HTTP server for Express plus Socket.IO, and the client
uses WebSocket transport directly, as required by Vercel. Enable Fluid compute.
Connections can close at the function duration limit; Socket.IO reconnects.
The existing Socket.IO adapter stores rooms in memory: cross-instance broadcasts
still require a shared adapter (for example Redis). This routing change does not
add a new hosted pub/sub dependency or guarantee multi-instance chat delivery.

References: [Services](https://vercel.com/docs/services),
[routing](https://vercel.com/docs/services/routing),
[bindings](https://vercel.com/docs/services/bindings),
[Express](https://vercel.com/docs/frameworks/backend/express), and
[WebSockets](https://vercel.com/docs/functions/websockets).
