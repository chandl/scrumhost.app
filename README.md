# scrum-host

A real-time, no-signup tool for running Scrum ceremonies — **backlog refinement** and **retrospectives** — with optional end-to-end encryption for backlog story details.

Anyone can create a room, share the code (and optional password), and run the ceremony live with their team. There are no accounts: participants join with just a name.

## Features

- **Backlog refinement** — add stories, estimate with points, open a story for voting, reveal votes, and mark stories queued/reviewed/skipped.
- **Retrospective** — three lanes (Went Well / To Improve / Action Items) with comments and upvotes.
- **Real-time sync** across participants via PocketBase subscriptions.
- **Room passphrase auth** — rooms are joined with a code (`XXX-XXX-XXXX`) and an optional password; the passphrase is hashed before it's sent.
- **End-to-end encryption** — refinement story details are encrypted client-side (AES-GCM, key derived from the room passphrase), so the server never sees plaintext story content.
- **Shareable join links** with the room key embedded, so invited teammates don't need to re-enter the password.

## Tech stack

- [SvelteKit 2](https://svelte.dev/docs/kit) + [Svelte 5](https://svelte.dev/) + [Vite 5](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/) + [bits-ui](https://www.bits-ui.com/) + [lucide-svelte](https://lucide.dev/)
- [PocketBase](https://pocketbase.io/) as the backend (auth, rooms, participants, stories, estimates, retro items/comments)
- [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/) for unit tests
- [Playwright](https://playwright.dev/) for E2E tests (including multi-user scenarios)

## Prerequisites

- Node.js (see `engine-strict=true` in `.npmrc` — check `package.json` for the version this repo expects)
- npm

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env.local` (or `.env`) file in the project root:

```bash
PUBLIC_BACKEND_URL="http://127.0.0.1:8080"
PUBLIC_ENABLE_BACKLOG_ROOMS=true
PUBLIC_ENABLE_BACKLOG_MERGE_TASKS=false
```

- `PUBLIC_BACKEND_URL` — the URL of the PocketBase instance the app talks to.
- `PUBLIC_ENABLE_BACKLOG_ROOMS` / `PUBLIC_ENABLE_BACKLOG_MERGE_TASKS` — feature flags for in-progress backlog functionality.

### 3. Run PocketBase locally

The PocketBase binary and its data directory live in `pb/` (gitignored). A prebuilt binary is checked into that folder:

```bash
cd pb
./pocketbase serve --http=127.0.0.1:8080
```

The collection schema is defined in [`schema/pb_schema.json`](schema/pb_schema.json) — import it from the PocketBase admin UI (`http://127.0.0.1:8080/_/`) on a fresh instance.

A `Dockerfile` for running PocketBase in a container is also available at [`pocketbase/Dockerfile`](pocketbase/Dockerfile).

### 4. Run the dev server

```bash
npm run dev

# or start the server and open it in a new browser tab
npm run dev -- --open
```

The app will be available at `http://localhost:5173`.

## Available scripts

| Script                  | Description                                       |
| ------------------------ | -------------------------------------------------- |
| `npm run dev`            | Start the SvelteKit dev server                     |
| `npm run build`          | Build for production                                |
| `npm run preview`        | Preview the production build locally                |
| `npm run check`          | Type-check with `svelte-check`                      |
| `npm run check:watch`    | Type-check in watch mode                             |
| `npm run lint`           | Check formatting (Prettier) and lint (ESLint)        |
| `npm run format`         | Auto-format the codebase with Prettier               |
| `npm run test` / `test:unit` | Run unit tests once (Vitest)                    |
| `npm run test:unit:watch`| Run unit tests in watch mode                          |
| `npm run test:coverage`  | Run unit tests with coverage report                   |
| `npm run test:e2e`       | Run Playwright E2E tests                              |
| `npm run test:e2e:ui`    | Run Playwright tests with the interactive UI          |

## Project structure

```
src/
  lib/
    components/ui/     # Shared UI primitives (bits-ui based)
    crypto.ts           # Client-side encryption helpers
    pocketbase/          # PocketBase client setup
    scrum/                # Domain logic: rooms, stories, estimates, retro, users
  routes/
    home/                 # Landing / room creation & join
    join/                 # Join-by-code flow
    room/[id]/             # Room page — refinement or retrospective UI
    room-not-found/         # 404 for invalid room codes
pb/                          # Local PocketBase binary + data (gitignored)
pocketbase/Dockerfile        # Container build for PocketBase
schema/pb_schema.json        # PocketBase collection schema
docs/                        # Roadmap and testing plan notes
tests/                       # Playwright E2E tests
```

## Testing

- Unit tests live alongside the code they test (e.g. `src/lib/scrum/room.test.ts`) and mock PocketBase via `src/test/pocketbase-mock.ts`.
- E2E tests live in `tests/` and are run with Playwright; see `playwright.config.ts` for configuration.
- See [`docs/TESTING_PLAN.md`](docs/TESTING_PLAN.md) for the full testing strategy.

## Deployment

The project uses `@sveltejs/adapter-auto`, which picks an adapter based on the deployment target (Vercel, Netlify, etc.) — see the [SvelteKit adapters docs](https://svelte.dev/docs/kit/adapters). `@vercel/analytics` is included as a dependency, consistent with deploying to Vercel. PocketBase needs to be deployed separately (see `pocketbase/Dockerfile`) and its URL set via `PUBLIC_BACKEND_URL`.

## Roadmap

See [`docs/ROADMAP.md`](docs/ROADMAP.md) for a strategic review and prioritized feature roadmap.
