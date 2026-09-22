# Canary

`canary` is a small standalone Node/TypeScript service that continuously exercises the scrum-host end-to-end contract, the same way tmpmail.fyi's `canary` does for that project. It runs two tiers of checks:

- **API/realtime contract check** (every `CANARY_INTERVAL`, default 2m): using the real `pocketbase` client SDK, two independent identities sign up, join a passphrase-gated room, and exchange writes — a backlog-refinement story (E2E-encrypted and decrypted exactly as the app does) with votes, and a retro item with an upvote and a comment. Each side's PocketBase realtime subscription must observe the other's writes within a timeout. This is the closest analog to tmpmail's SMTP → inbox propagation check, just over PocketBase's SSE realtime API instead of SMTP.
- **Browser/UI check** (every `CANARY_UI_INTERVAL`, default 15m): headless Playwright drives the actual deployed frontend in two browser contexts — create room, join by code + password, vote, reveal, add/upvote a retro item — verifying the _rendered_ app reflects cross-user realtime updates, not just the API. Adapted from [tests/e2e/multi-user.spec.ts](../tests/e2e/multi-user.spec.ts).

It exposes JSON health on `GET /healthz`: `200` when every check in the most recent run of each tier passed, `503` otherwise. `GET /livez` always returns `200` while the process is running.

Every canary-created user, room, and item is tagged with `CANARY_NAME_PREFIX` (default `canary`). **Nothing is cleaned up automatically** — every collection's `deleteRule` in `schema/pb_schema.json` is admin-only, so cleanup needs a separate, admin-authenticated job; it isn't part of this service so the always-running probe never holds superuser credentials. Purge `canary-*` users/rooms periodically via a separate script or PocketBase admin action.

## Run

```sh
cd canary
npm install
CANARY_APP_URL=https://scrumhost.app \
CANARY_API_URL=https://api.scrumhost.app \
npm run dev
```

The process runs both tiers immediately at startup, then on their respective intervals.

## Docker

```sh
cd canary
docker build -t scrum-host-canary .
docker run -d --name scrum-host-canary --restart unless-stopped \
  -p 8081:8081 \
  -e CANARY_APP_URL=https://scrumhost.app \
  -e CANARY_API_URL=https://api.scrumhost.app \
  scrum-host-canary
```

The image is based on `mcr.microsoft.com/playwright` so the UI tier's Chromium has its OS dependencies pre-installed. For a ready-to-edit deployment, `docker compose up --build -d` from this directory uses [compose.yaml](compose.yaml).

## Configuration

| Environment variable | Default                     | Purpose                                                     |
| -------------------- | --------------------------- | ----------------------------------------------------------- |
| `CANARY_HTTP_ADDR`   | `:8081`                     | Address for `/healthz` and `/livez`.                        |
| `CANARY_INTERVAL`    | `2m`                        | Interval between API/realtime contract check runs.          |
| `CANARY_TIMEOUT`     | `30s`                       | Deadline for one API/realtime check.                        |
| `CANARY_UI_INTERVAL` | `15m`                       | Interval between browser/UI check runs.                     |
| `CANARY_UI_TIMEOUT`  | `120s`                      | Deadline for one browser/UI check.                          |
| `CANARY_APP_URL`     | `https://scrumhost.app`     | Base URL of the deployed SvelteKit frontend (UI checks).    |
| `CANARY_API_URL`     | `https://api.scrumhost.app` | Base URL of the PocketBase API (API/realtime checks).       |
| `CANARY_NAME_PREFIX` | `canary`                    | Prefix applied to all canary-created usernames/rooms/items. |
