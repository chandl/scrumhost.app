Here’s a strategic read and a prioritized feature roadmap for **scrum-host**.

---

# Strategic review: scrum-host

## Step 1 — Understanding

**What it does**  
scrum-host is a **real-time collaboration app** for two Scrum ceremonies:

- **Backlog refinement** — Add tasks/stories, set point values (e.g. Fibonacci), open a story for voting, participants vote, host reveals and can mark QUEUED/REVIEWED/SKIPPED. Story details are **E2E encrypted** (AES-GCM, key from room passphrase).
- **Retrospective** — Three lanes (Went Well / To Improve / Action Items), add items, comment, upvote. All synced via PocketBase real-time subscriptions.

Core flow: **anonymous signup by name** → **create or join room** (code + optional password) → **single room type per room** (refinement or retro). Room code is `XXX-XXX-XXXX`; passphrase is hashed (SHA-256) for join auth and used to encrypt refinement story text. Home shows “recently joined rooms” with rejoin; room page shows code, optional password reveal, and the right ceremony UI.

**Who uses it**  
Teams (or facilitators) running refinement or retros. No accounts beyond “name” at join; no email. Target is **low-friction, session-based** use.

**Tech stack**

- **Frontend**: SvelteKit 2, Svelte 5, Vite 5, Tailwind, bits-ui, lucide-svelte.
- **Backend**: PocketBase (auth, rooms, participants, refinement_metadata, stories, story_estimates, retro_metadata, retro_items, retro_comments, retro_votes).
- **Testing**: Vitest + Testing Library (unit), Playwright (E2E, including multi-user).
- **Deploy**: `adapter-auto`, Vercel Analytics in deps — consistent with a Vercel-deployed app.

**Current stage**  
**Active product / late MVP**: Two ceremony types implemented, E2E encryption for refinement details, real-time, password-protected rooms, and a defined testing plan. Landing promises “Sprint Planning” but only Refinement + Retro exist — positioning is slightly ahead of features.

**Known goals/constraints**

- Testing plan in `docs/TESTING_PLAN.md` (unit + E2E, multi-user).
- `PUBLIC_ENABLE_BACKLOG_MERGE_TASKS` in test env suggests future “merge tasks” or similar.
- ~~Room join by code currently fails silently~~ — fixed: join errors surface via ScrumAlert on home (404 → “Room not found. Check the code and try again.”).
- Room header has "Copy join link" (URL with #pwd=); ParticipantList shows "Re-enter password to share link" when key missing.

---

## Step 2 — Strategic analysis

**What problem is this uniquely suited to solve?**  
“Zero-account, real-time refinement and retros with optional privacy.” The differentiator is **no signup** plus **room-level passphrase and E2E-encrypted story text** so sensitive backlog content never sits in plaintext on the server. That’s the wedge: teams that want a quick ceremony tool without handing a SaaS vendor their story text.

**Where is the moat?**

- **Privacy by design**: E2E for refinement details + passphrase-gated rooms.
- **Simplicity**: Name-only entry, code + password to join.
- **Real-time on a simple stack**: PocketBase subscriptions give multi-user sync without a custom backend.

**Highest-potential version in 12–24 months**  
A **default tool for distributed teams** for refinement and retros: one link, no accounts, encrypted when you want it, with optional “bring your backlog” (e.g. Jira/Linear) and light persistence (export/session history). It stays opinionated on ceremonies and avoids becoming a generic whiteboard.

**Architectural / product choices that matter**

- **PocketBase as single backend**: Fast to ship and scale to many small teams; if you later need heavier rules, webhooks, or deep integrations, you may add a thin API or edge layer.
- **Room = one type**: Clean. “Sprint planning” as a third type would likely reuse refinement (stories + points) with different workflow (e.g. capacity, commitment).
- **Cookie-held room key**: Works for same browser; cross-device or “forgot link” flows need a defined story (e.g. host re-share, or optional recovery).
- **No persistence/export**: Sessions are ephemeral from a product perspective; adding “export retro/backlog” or “reopen last session” would materially increase stickiness.

---

## Step 3 — New feature ideas

### Quick wins

| Idea                                   | What it does                                                                                                                                          | Why it matters                                                    | Notes                                                                                                           |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Join-by-code error feedback**        | Surface failure when room code is wrong or room doesn’t exist (e.g. ScrumAlert or inline message on home).                                            | Today join fails silently; this removes a major UX dead-end.      | Use existing `ScrumAlert`; `joinRoomWithCode` already catches errors.                                           |
| **Copy join link (with password)**     | In room header or ParticipantList: “Copy join link” that copies `currentOrigin/room/:id#pwd=<roomKey>`.                                               | One-click share so invitees get both URL and access.              | Derive from `getRoomKeyCookie` + current URL; handle missing key (e.g. show “Re-enter password to share link”). |
| **Landing vs product alignment**       | Remove or soften “Sprint Planning” in the typewriter/list until a sprint-planning mode exists, or add a short “Coming soon.”                          | Avoids overpromising and keeps trust.                             | Copy change only.                                                                                               |
| **404 for invalid room**               | When `getRoomDetails(roomId)` fails (e.g. not found), redirect to a `/room-not-found` or show a clear “Room not found” view instead of generic error. | Room page already has a TODO for this; completes the error story. | One route + redirect or branch in room `+page`.                                                                 |
| **Host indicator in refinement/retro** | Show a “Host” badge or label next to the room creator in participant list.                                                                            | Clarifies who can reveal votes, advance stories, or manage.       | `parent_room.creator` or participant id vs host; already available in room/metadata.                            |

### High-impact features

| Idea                          | What it does                                                                                                                               | Why it matters                                                                                          | Notes                                                                                                                         |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Export retro / refinement** | “Export” for retro: markdown or CSV (lanes, items, votes, comments). For refinement: list of stories + status + optional point summary.    | Gives teams an artifact for Confluence/Notion/slack and makes the session “count” after the tab closes. | Read-only dump from current PocketBase data; no new backend model.                                                            |
| **Sprint planning mode**      | New room type or refinement variant: same story/point model, add “capacity” or “commitment” and a clear “this is our sprint backlog” view. | Matches landing promise and fills the gap between refinement and “we planned the sprint.”               | Reuse refinement_metadata/stories; add planning-specific UI and maybe a `room_subtype` or flag.                               |
| **Reopen / recent sessions**  | Persist “last N rooms” per user (or per browser) with room id + code; “Reopen” from home even if cookie expired, by re-entering code.      | Reduces “we lost the room” support and increases return use.                                            | May need “join by code + password” from home when not in room (you have join by code; adding password on home completes it).  |
| **Custom point scales**       | Let host choose or define point set (e.g. 1,2,3,5,8 or T-shirt) per refinement room.                                                       | Aligns with how different teams estimate.                                                               | Schema already has `point_values` (text); likely a predefined set or JSON; UI in RoomCreator/refinement settings.             |
| **Keyboard shortcuts**        | Global shortcuts: e.g. “Reveal votes”, “Next story”, “Add item” in retro.                                                                  | Speeds up facilitation for power users.                                                                 | Svelte keydown handlers; document in UI or tooltip.                                                                           |
| **Facilitator controls**      | Explicit “host only” actions: clear votes, skip story, lock voting, reset retro board (with confirm).                                      | Prevents accidental or malicious changes and supports strict facilitation.                              | Check `participant.id === refinement_metadata.host` (or room creator); gate actions in UI and optionally in PocketBase rules. |

### Bold bets

| Idea                               | What it does                                                                                                                                      | Why it matters                                                                                   | Notes                                                                                                     |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| **Jira / Linear integration**      | “Import backlog” from Jira/Linear (read-only): fetch issues into refinement as stories. “Sync back” optional (e.g. write estimate to Jira field). | Positions scrum-host as the ceremony layer on top of existing backlogs; strong B2B pull.         | OAuth + provider APIs; backend or edge for tokens; rate limits and scopes.                                |
| **Templates and recurring retros** | Saved retro templates (lane names, prompts). Optional “recurring” link that creates a new retro session each time (e.g. “Team Alpha Retro”).      | Reduces setup and supports ritual cadence.                                                       | Templates = config blob or new collection; recurring = slug or short link that creates room on first hit. |
| **Optional persistent accounts**   | Keep anonymous flow; add “Save to account” (email/password or OAuth): link current session to identity, “My rooms” and history.                   | Enables “my retros,” exports history, and future paid/team features without breaking current UX. | PocketBase auth already supports it; add optional profile linking and a “My rooms” view.                  |
| **Embeddable widget**              | Iframe or embed for refinement/retro inside Confluence, Notion, or Slack.                                                                         | Distribution where teams already work.                                                           | Same app with embed layout and postMessage or URL params for room; CORS and cookie considerations.        |

---

## Step 4 — Prioritized action plan

| #   | Action                                                                                           | Category  | Strategic rationale                                                                   | Effort |
| --- | ------------------------------------------------------------------------------------------------ | --------- | ------------------------------------------------------------------------------------- | ------ |
| 1   | ~~**Show join-by-code errors** (ScrumAlert or inline on home when join fails)~~                      | Feature   | Removes silent failure and builds trust; no point in more features if join is broken. | Low ✅ |
| 2   | ~~**“Copy join link” with #pwd=** in room (and handle missing key)~~                                 | Feature   | Unlocks viral sharing and reduces “how do I invite?” friction.                        | Low ✅ |
| 3   | ~~**Room not found / 404** handling (redirect or dedicated view)~~                                   | Feature   | Completes error story; professional and clear.                                        | Low ✅ |
| 4   | **Export retro** (markdown or CSV: lanes, items, votes, comments)                                | Feature   | Makes retros actionable and shareable; increases perceived value.                     | Med    |
| 5   | **Export refinement** (story list + status + point summary)                                      | Feature   | Same as above for refinement; consistent “takeaway” story.                            | Med    |
| 6   | **Host badge + facilitator-only actions** (reveal, skip, clear votes; confirm where destructive) | Feature   | Clarifies control and prevents chaos in multi-participant rooms.                      | Med    |
| 7   | **Landing copy alignment** (Sprint Planning → “Coming soon” or remove)                           | Direction | Keeps promise and positioning honest.                                                 | Low    |
| 8   | **Custom / configurable point scales** for refinement                                            | Feature   | Different teams estimate differently; schema supports it.                             | Med    |
| 9   | **Sprint planning mode** (refinement variant with commitment/capacity view)                      | Feature   | Delivers on landing and fills the ceremony gap.                                       | High   |
| 10  | **Reopen session from home** (join by code + password when not in room; “recent” with re-auth)   | Feature   | Reduces lost-room anxiety and encourages reuse.                                       | Med    |
| 11  | **Optional persistent accounts** (“Save to account”, “My rooms”)                                 | Direction | Foundation for history, teams, and future monetization without breaking anonymity.    | High   |
| 12  | **Jira/Linear import (read-only)** for refinement backlogs                                       | Bold bet  | Differentiator for teams already in Jira/Linear; validates integration demand.        | High   |

---

## Strategic summary

scrum-host should aim to be the **default low-friction, privacy-aware tool** for refinement and retrospectives: one link, no signup, encrypted when it matters. The top priorities do three things: **fix the join experience** (errors, share link, 404) so every session can start and be shared; **add takeaways** (export retro + refinement and host controls) so sessions feel productive and under control; and **align positioning and roadmap** (landing copy, sprint planning, optional accounts) so the product and the promise match and you have a path to “bring your backlog” and optional persistence. Nail reliability and sharing first, then layer exports and facilitator controls; from there, sprint planning and integrations (or embed) can define the next phase.
