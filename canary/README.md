# Canary

`canary` is a small standalone Node/TypeScript service that continuously exercises the scrum-host end-to-end contract, the same way tmpmail.fyi's `canary` does for that project. It runs two tiers of checks:

- **API/realtime contract check** (every `CANARY_INTERVAL`, default 2m): using the real `pocketbase` client SDK, two independent identities sign up, join a passphrase-gated room, and exchange writes — a backlog-refinement story (E2E-encrypted and decrypted exactly as the app does) with votes, and a retro item with an upvote and a comment. Each side's PocketBase realtime subscription must observe the other's writes within a timeout. This is the closest analog to tmpmail's SMTP → inbox propagation check, just over PocketBase's SSE realtime API instead of SMTP.
- **Browser/UI check** (every `CANARY_UI_INTERVAL`, default 15m): headless Playwright drives the actual deployed frontend in two browser contexts — create room, join by code + password, vote, reveal, add/upvote a retro item — verifying the _rendered_ app reflects cross-user realtime updates, not just the API. Adapted from [tests/e2e/multi-user.spec.ts](../tests/e2e/multi-user.spec.ts).

It exposes JSON health on `GET /healthz`: `200` when every check in the most recent run of each tier passed, `503` otherwise. `GET /livez` always returns `200` while the process is running.

Every canary-created user, room, and item is tagged with `CANARY_NAME_PREFIX` (default `canary`). Every collection's `deleteRule` in `schema/pb_schema.json` is admin-only, so the always-running probe never holds superuser credentials and can't clean up after itself. A separate `cleanup` entrypoint ([src/cleanup.ts](src/cleanup.ts)) does that instead: authenticated as a PocketBase superuser, it periodically deletes `canary-*` rooms (and everything hanging off them — participants, refinement/retro metadata, stories, estimates, items, comments, votes; nothing in the schema cascades) plus `canary-*` users, skipping anything younger than `CANARY_CLEANUP_MAX_AGE` so it never touches a check that's still in flight.

Run it with `npm run cleanup` (or `docker compose run --rm cleanup` / the `cleanup` service in [compose.yaml](compose.yaml)), which needs `CANARY_ADMIN_EMAIL` / `CANARY_ADMIN_PASSWORD` for a PocketBase superuser — credentials this service is the only place that should hold them.

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

### Cleanup job

| Environment variable         | Default   | Purpose                                                            |
| ----------------------------- | --------- | -------------------------------------------------------------------- |
| `CANARY_ADMIN_EMAIL`         | _required_ | Email of a PocketBase superuser, used to authenticate deletes.       |
| `CANARY_ADMIN_PASSWORD`      | _required_ | That superuser's password.                                           |
| `CANARY_CLEANUP_MAX_AGE`     | `30m`     | Only purge canary-* records older than this.                         |
| `CANARY_CLEANUP_INTERVAL`    | `1h`      | How often the cleanup job runs.                                      |

Also reads `CANARY_API_URL` and `CANARY_NAME_PREFIX` from the table above.
