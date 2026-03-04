# Testing Plan: scrum-host

This document outlines a plan to add **unit tests** and **Playwright-based integration/E2E tests** (including multi-user scenarios) to the scrum-host SvelteKit app.

---

## 1. Current Stack Summary

- **Frontend**: SvelteKit (Svelte 5), Vite 5
- **Backend**: PocketBase (external; auth, rooms, participants, stories, story_estimates)
- **Key flows**: Anonymous signup by name → create/join room by code + password → refinement (tasks, voting) or retrospective (lanes, comments)

No test runner or E2E tooling is currently configured.

---

## 2. Unit Testing (Vitest + Svelte Testing Library)

### 2.1 Tooling

- **Vitest** – Vite-native runner, fast, same config as dev. Fits SvelteKit well.
- **@testing-library/svelte** – Component tests with user-centric queries.
- **jsdom** (or **happy-dom**) – DOM for component tests.
- Optional: **@vitest/coverage-v8** for coverage.

### 2.2 What to Unit Test

| Area             | Files / modules                | Strategy                                                                                                                                                                                                                                                                                                                            |
| ---------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Pure utils**   | `src/lib/utils.ts`             | Test `cn()`, `formatTimeAgo()`, `getRoomKeyCookie` / `setRoomKeyCookie` (with jsdom or by mocking `document.cookie`).                                                                                                                                                                                                               |
| **Crypto**       | `src/lib/crypto.ts`            | Test `hashString()` (deterministic output for known input), `encryptString`/`decryptString` round-trip. Use fake timers or skip heavy PBKDF2 in CI if needed.                                                                                                                                                                       |
| **Room helpers** | `src/lib/scrum/room.ts`        | Mock PocketBase (`vi.mock('$lib/pocketbase/pocketbase')`). Test: `getParticipantInRoom`, `getUserParticipant`, `getRoomDetails`, `joinRoomAndGetParticipantDetails`, `createRoom` (with mocked pb). Extract `createRoomCode` / `createRoomPasscode` into a testable module if you want to assert format (e.g. `\d{3}-\d{3}-\d{4}`). |
| **Estimates**    | `src/lib/scrum/estimates.ts`   | Mock pb; test `getEstimateByStoryAndUser`, `createOrUpdateEstimate` (create vs update path), `deleteEstimates`.                                                                                                                                                                                                                     |
| **Stories**      | `src/lib/scrum/story.ts`       | Mock pb; test `createStory`, `getStoryWithEstimatesById`, `setStoryStatus`.                                                                                                                                                                                                                                                         |
| **User**         | `src/lib/scrum/user.ts`        | Mock pb and `goto`; test `signup`, `login`, `logout`, `validateLogin` (redirect when no user), `generatePassword` (length), `generateUsername` (format).                                                                                                                                                                            |
| **Components**   | Buttons, cards, forms, dialogs | Test rendering and key interactions (e.g. JoinRoomDialog submit, RoomCreator create, form validation). Prefer testing behavior, not implementation.                                                                                                                                                                                 |

### 2.3 Test Layout

- Co-locate or mirror structure, e.g.:
  - `src/lib/utils.test.ts`
  - `src/lib/crypto.test.ts`
  - `src/lib/scrum/room.test.ts`
  - `src/lib/scrum/user.test.ts`
  - `src/lib/scrum/estimates.test.ts`
  - `src/lib/scrum/story.test.ts`
  - `src/routes/room/[id]/components/JoinRoomDialog.test.ts` (or under `__tests__` next to component)

### 2.4 SvelteKit / $env and aliases

- In Vitest, configure `resolve.alias` for `$lib` (reuse Vite’s or define in `vitest.config.ts`).
- For `$env/static/public`, use `vi.stubEnv` or a `src/test/setup.ts` that sets `process.env`/`import.meta.env` so `PUBLIC_BACKEND_URL` is defined (e.g. `http://localhost:8090`) in tests.

### 2.5 Mocking PocketBase

- Create a **test double** (e.g. `src/test/pocketbase-mock.ts`) that implements the parts of PocketBase used in the app: `pb.collection(...).getOne`, `getFirstListItem`, `create`, `update`, `authStore`, etc.
- In unit tests, `vi.mock('$lib/pocketbase/pocketbase', () => ({ default: mockPb })`. This keeps tests fast and offline.

---

## 3. Playwright E2E & Multi-User Integration Tests

### 3.1 Tooling

- **Playwright** – multi-browser E2E and multi-context (multi-user) scenarios.
- **@playwright/test** – runner and assertions.

### 3.2 Environment Assumptions

- **App**: SvelteKit dev server or preview build (e.g. `http://localhost:5173`).
- **Backend**: **Local PocketBase is assumed to be running** (e.g. `http://localhost:8090` or whatever `PUBLIC_BACKEND_URL` is). Start it before running E2E tests; no Docker or process orchestration is required in the test runner.

### 3.3 Single-User E2E Flows

| Flow                            | Steps                                                                                                                            |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Landing → Join**              | Open `/` → click “Join a Room” / “Host a Room” → redirect to `/join`.                                                            |
| **Join (name)**                 | On `/join`, enter name, submit → redirect to `/home`, see “Welcome, &lt;name&gt;”.                                               |
| **Create room**                 | On `/home`, fill room name, choose type (Refinement / Retrospective), submit → redirect to `/room/[id]`, see room name and code. |
| **Join by code**                | On `/home`, enter room code, submit → redirect to `/room/[id]`. If password required, show JoinRoomDialog.                       |
| **Room with password**          | Open room URL with `#pwd=<password>` → join and see room UI.                                                                     |
| **Refinement (single user)**    | In refinement room, create a task, open it, vote, reveal (if applicable).                                                        |
| **Retrospective (single user)** | In retro room, add item to a lane, add comment.                                                                                  |

These can be one spec per flow or grouped (e.g. `auth.spec.ts`, `room-create-join.spec.ts`, `refinement.spec.ts`, `retrospective.spec.ts`).

### 3.4 Multi-User (Multi-Context) Scenarios

Use Playwright’s **multiple browser contexts** (or incognito-like contexts) to simulate different users in the same room.

| Scenario                          | User A                                  | User B (and optionally C)                            | What to assert                                                          |
| --------------------------------- | --------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------- |
| **Two users join same room**      | Create room, copy room code + password  | Go to `/join`, then `/home`, join by code + password | Both see same room name/code; participant list shows both.              |
| **Refinement: voting visibility** | Create refinement room, add story, vote | Join room, open same story, vote                     | Both see story; after reveal, both see same vote summary.               |
| **Retrospective: shared board**   | Create retro room, add item to lane     | Join room                                            | Both see same lanes and items (real-time via PocketBase subscriptions). |
| **Room code validation**          | —                                       | Enter invalid code                                   | Error or no navigation to room.                                         |

Implementation pattern:

- **Context A**: `contextA = await browser.newContext()` → `pageA = await contextA.newPage()`.
- **Context B**: `contextB = await browser.newContext()` → `pageB = await contextB.newPage()`.
- User A: signup name “Alice”, create room, read room code and password from DOM (or from network/localStorage if you expose them in test).
- User B: signup name “Bob”, join with that code and password.
- Use `pageA` and `pageB` to assert on both UIs (e.g. participant list, story votes, retro items).

Optional: use **storageState** to save auth after “join” and reuse for faster tests.

### 3.5 Test Data and Backend State

- With local PocketBase running, tests can create all data via the UI (signup → create room → join). No backend seeding required; use unique names/room codes per run if you need isolation from dev data.

### 3.6 Playwright Project Layout

- **Directory**: `e2e/` or `tests/e2e/` at repo root.
- **Specs**: e.g. `e2e/landing.spec.ts`, `e2e/join-auth.spec.ts`, `e2e/room-create-join.spec.ts`, `e2e/refinement.spec.ts`, `e2e/retrospective.spec.ts`, `e2e/multi-user-refinement.spec.ts`, `e2e/multi-user-retro.spec.ts`.
- **Config**: `playwright.config.ts` with baseURL, timeout, retries; one project per browser (chromium, firefox, webkit) or start with chromium only for speed.
- **Fixtures** (optional): custom fixture “signedInUser” that does signup and returns `{ page, userName }` to avoid repeating join flow in every spec.

### 3.7 Stability and Timing

- Use **data-testid** (or similar) on critical elements (room code, password field, participant list, story cards) so selectors are stable.
- For real-time updates (PocketBase subscriptions), use `expect(locator).toHaveText(...)` or `toContainText` with timeout so Playwright waits for the other user’s actions to appear.

---

## 4. Implementation Order

1. **Vitest + config** – Add Vitest, jsdom/happy-dom, `@testing-library/svelte`; add `vitest.config.ts` (or extend Vite config); add npm script `test` / `test:unit`.
2. **Env and PocketBase mock** – Test setup for `$env` and shared PocketBase mock.
3. **Unit tests (no PB)** – `utils`, `crypto` (and room code/passcode if extracted).
4. **Unit tests (mocked PB)** – `room`, `user`, `estimates`, `story`.
5. **Component unit tests** – JoinRoomDialog, RoomCreator, and one or two key refinement/retro components.
6. **Playwright** – Install Playwright, `playwright.config.ts`, and one simple single-user spec (e.g. landing → join → home).
7. **Single-user E2E** – Create room, join by code, refinement and retro flows.
8. **Multi-user E2E** – Two contexts: create room + join room; then refinement voting and retro board visibility.

---

## 5. NPM Scripts (Suggested)

```json
{
	"scripts": {
		"test": "vitest",
		"test:unit": "vitest run",
		"test:unit:watch": "vitest",
		"test:coverage": "vitest run --coverage",
		"test:e2e": "playwright test",
		"test:e2e:ui": "playwright test --ui"
	}
}
```

---

## 6. CI Considerations

- **Unit**: Run on every PR; no services required.
- **E2E**: Assume **local PocketBase is already running**. Start the SvelteKit app (e.g. `npm run dev` or `npm run preview`), then run `playwright test`. For CI, you would need to start PocketBase (e.g. Docker or binary) before the E2E step if you run E2E there.

---

## 7. Summary

| Test type       | Tool                       | Scope                                                             |
| --------------- | -------------------------- | ----------------------------------------------------------------- |
| Unit            | Vitest + Testing Library   | Utils, crypto, scrum logic (mocked PB), selected components       |
| E2E single-user | Playwright                 | Landing, join, create/join room, refinement, retrospective        |
| E2E multi-user  | Playwright (multi-context) | Two users in same room; refinement voting and retro board in sync |

This plan gives you a clear path to add unit tests and Playwright-based integration tests with multi-user scenarios, aligned with your current SvelteKit + PocketBase setup.
