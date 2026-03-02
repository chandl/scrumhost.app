import { expect, test } from '@playwright/test';

async function goToHome(
	page: {
		goto: (url: string) => Promise<void>;
		getByRole: (role: string, opts?: { name: string }) => any;
		getByLabel: (label: string) => any;
	},
	name: string
) {
	await page.goto('/');
	await page.getByRole('link', { name: 'Join a Room' }).click();
	await expect(page).toHaveURL('/join');
	await page.getByLabel('Your Name').fill(name);
	await page.getByRole('button', { name: 'Continue' }).click();
	await expect(page).toHaveURL('/home');
}

test.describe('Two users, same room', () => {
	test('Context A creates room, gets code+password; Context B joins by code+password; both see same room name/code and participant list shows both users', async ({
		browser
	}) => {
		const nameA = `MultiUserAlice-${Date.now()}`;
		const nameB = `MultiUserBob-${Date.now()}`;
		const roomName = `E2E Multi-User Room ${Date.now()}`;

		const contextA = await browser.newContext();
		const pageA = await contextA.newPage();

		const contextB = await browser.newContext();
		const pageB = await contextB.newPage();

		try {
			// Context A: go to home, create room, get code + password
			await goToHome(pageA, nameA);
			await pageA.getByRole('button', { name: 'Create Room' }).click();
			await pageA.getByRole('radio', { name: 'Backlog Refinement (Planning Poker)' }).click();
			await pageA.getByRole('button', { name: 'Next' }).click();
			await pageA.getByTestId('room-name-input').fill(roomName);
			await pageA.getByRole('dialog').getByRole('button', { name: 'Create Room' }).click();

			await expect(pageA).toHaveURL(/\/room\/[^/]+$/);
			await expect(pageA.getByRole('heading', { name: roomName, level: 1 })).toBeVisible();
			const roomCode = await pageA.getByTestId('room-code').textContent();
			expect(roomCode).toBeTruthy();

			await pageA.getByTestId('room-password-reveal').click();
			const roomPassword = await pageA.getByTestId('room-password-value').textContent();
			expect(roomPassword).toBeTruthy();

			// Context B: /join then /home, join by code + password
			await goToHome(pageB, nameB);
			await pageB.getByTestId('room-code-input').fill(roomCode!.trim());
			await pageB.getByRole('button', { name: 'Join Room' }).click();

			await expect(pageB).toHaveURL(/\/room\/[^/]+$/);
			await expect(pageB.getByTestId('join-room-password')).toBeVisible();
			await pageB.getByTestId('join-room-password').fill(roomPassword!.trim());
			await pageB.getByRole('button', { name: 'Join Room' }).click();

			await expect(pageB.getByRole('heading', { name: roomName, level: 1 })).toBeVisible({
				timeout: 10_000
			});

			// Assert both see same room name and room code
			await expect(pageA.getByRole('heading', { name: roomName, level: 1 })).toBeVisible();
			await expect(pageA.getByTestId('room-code')).toHaveText(roomCode!.trim());
			await expect(pageB.getByRole('heading', { name: roomName, level: 1 })).toBeVisible();
			await expect(pageB.getByTestId('room-code')).toHaveText(roomCode!.trim());

			// Assert participant list shows both users on both pages (wait for real-time sync)
			await expect(pageA.getByTestId('participant-list')).toBeVisible();
			await expect(pageA.getByTestId('participant-item').filter({ hasText: nameA })).toBeVisible();
			await expect(pageA.getByTestId('participant-item').filter({ hasText: nameB })).toBeVisible({
				timeout: 10_000
			});

			await expect(pageB.getByTestId('participant-list')).toBeVisible();
			await expect(pageB.getByTestId('participant-item').filter({ hasText: nameA })).toBeVisible({
				timeout: 10_000
			});
			await expect(pageB.getByTestId('participant-item').filter({ hasText: nameB })).toBeVisible();
		} finally {
			await contextA.close();
			await contextB.close();
		}
	});
});

test.describe('Refinement: voting visibility (multi-user)', () => {
	test('User A creates refinement room, adds story, votes; User B joins, opens same story, votes; after reveal both see same vote summary', async ({
		browser
	}) => {
		const nameA = `VoteAlice-${Date.now()}`;
		const nameB = `VoteBob-${Date.now()}`;
		const roomName = `E2E Voting Room ${Date.now()}`;
		const taskTitle = `E2E voting task ${Date.now()}`;
		const voteA = '3';
		const voteB = '5';

		const contextA = await browser.newContext();
		const pageA = await contextA.newPage();

		const contextB = await browser.newContext();
		const pageB = await contextB.newPage();

		try {
			// User A: go to home, create refinement room, get code + password
			await goToHome(pageA, nameA);
			await pageA.getByRole('button', { name: 'Create Room' }).click();
			await pageA.getByRole('radio', { name: 'Backlog Refinement (Planning Poker)' }).click();
			await pageA.getByRole('button', { name: 'Next' }).click();
			await pageA.getByTestId('room-name-input').fill(roomName);
			await pageA.getByRole('dialog').getByRole('button', { name: 'Create Room' }).click();

			await expect(pageA).toHaveURL(/\/room\/[^/]+$/);
			await expect(pageA.getByRole('heading', { name: roomName, level: 1 })).toBeVisible();
			const roomCode = await pageA.getByTestId('room-code').textContent();
			expect(roomCode).toBeTruthy();

			await pageA.getByTestId('room-password-reveal').click();
			const roomPassword = await pageA.getByTestId('room-password-value').textContent();
			expect(roomPassword).toBeTruthy();

			// User A: add story, open it, vote
			await pageA.getByTestId('create-task-input').fill(taskTitle);
			await pageA.getByTestId('create-task-submit').click();

			await pageA.getByRole('tab', { name: /Queued/ }).click();
			await expect(pageA.getByTestId('task-list')).toBeVisible({ timeout: 10_000 });
			await expect(pageA.getByText(taskTitle)).toBeVisible({ timeout: 5_000 });
			await pageA.getByTestId('start-voting').first().click();

			await expect(pageA.getByTestId('voting-buttons')).toBeVisible({ timeout: 5_000 });
			await pageA.getByTestId(`vote-${voteA}`).click();

			// User B: join room (same time or after A voted)
			await goToHome(pageB, nameB);
			await pageB.getByTestId('room-code-input').fill(roomCode!.trim());
			await pageB.getByRole('button', { name: 'Join Room' }).click();
			await expect(pageB).toHaveURL(/\/room\/[^/]+$/);
			await expect(pageB.getByTestId('join-room-password')).toBeVisible();
			await pageB.getByTestId('join-room-password').fill(roomPassword!.trim());
			await pageB.getByRole('button', { name: 'Join Room' }).click();
			await expect(pageB.getByRole('heading', { name: roomName, level: 1 })).toBeVisible({
				timeout: 10_000
			});

			// User B: open same story (Queued tab, Start Voting)
			await pageB.getByRole('tab', { name: /Queued/ }).click();
			await expect(pageB.getByText(taskTitle)).toBeVisible({ timeout: 10_000 });
			await pageB.getByTestId('start-voting').first().click();
			await expect(pageB.getByTestId('voting-buttons')).toBeVisible({ timeout: 10_000 });
			await pageB.getByTestId(`vote-${voteB}`).click();

			// Either user reveals (User A clicks Start Reviewing)
			await pageA.getByTestId('start-reviewing').click();

			// Both see same vote summary (real-time sync; use timeout)
			const summaryA = pageA.getByTestId('vote-summary');
			const summaryB = pageB.getByTestId('vote-summary');
			await expect(summaryA).toBeVisible({ timeout: 10_000 });
			await expect(summaryB).toBeVisible({ timeout: 10_000 });

			// Same vote summary: both show the two vote values (3 and 5)
			await expect(summaryA).toContainText(voteA, { timeout: 5_000 });
			await expect(summaryA).toContainText(voteB, { timeout: 5_000 });
			await expect(summaryB).toContainText(voteA, { timeout: 5_000 });
			await expect(summaryB).toContainText(voteB, { timeout: 5_000 });
		} finally {
			await contextA.close();
			await contextB.close();
		}
	});
});

test.describe('Retrospective: shared board (multi-user)', () => {
	test('User A creates retro room, adds item to lane; User B joins room; both see same lanes and items (real-time via PocketBase)', async ({
		browser
	}) => {
		const nameA = `RetroAlice-${Date.now()}`;
		const nameB = `RetroBob-${Date.now()}`;
		const roomName = `E2E Retro Shared Room ${Date.now()}`;
		const itemText = `E2E retro shared item ${Date.now()}`;

		const contextA = await browser.newContext();
		const pageA = await contextA.newPage();

		const contextB = await browser.newContext();
		const pageB = await contextB.newPage();

		try {
			// User A: go to home, create retrospective room, get code + password
			await goToHome(pageA, nameA);
			await pageA.getByRole('button', { name: 'Create Room' }).click();
			await pageA.getByRole('radio', { name: 'Sprint Retrospective' }).click();
			await pageA.getByRole('button', { name: 'Next' }).click();
			await pageA.getByTestId('room-name-input').fill(roomName);
			await pageA.getByRole('dialog').getByRole('button', { name: 'Create Room' }).click();

			await expect(pageA).toHaveURL(/\/room\/[^/]+$/);
			await expect(pageA.getByRole('heading', { name: roomName, level: 1 })).toBeVisible();
			const roomCode = await pageA.getByTestId('room-code').textContent();
			expect(roomCode).toBeTruthy();

			await pageA.getByTestId('room-password-reveal').click();
			const roomPassword = await pageA.getByTestId('room-password-value').textContent();
			expect(roomPassword).toBeTruthy();

			// User A: add item to "What Went Well" lane
			const laneA = pageA.getByTestId('retro-lane-went-well');
			await expect(laneA).toBeVisible({ timeout: 10_000 });
			await laneA.getByTestId('retro-lane-add-input').fill(itemText);
			await laneA.getByTestId('retro-lane-add-submit').click();

			// User A sees the item
			await expect(pageA.getByText(itemText)).toBeVisible({ timeout: 10_000 });
			await expect(pageA.getByTestId('retro-item-card')).toHaveCount(1, { timeout: 5_000 });

			// User B: join room
			await goToHome(pageB, nameB);
			await pageB.getByTestId('room-code-input').fill(roomCode!.trim());
			await pageB.getByRole('button', { name: 'Join Room' }).click();
			await expect(pageB).toHaveURL(/\/room\/[^/]+$/);
			await expect(pageB.getByTestId('join-room-password')).toBeVisible();
			await pageB.getByTestId('join-room-password').fill(roomPassword!.trim());
			await pageB.getByRole('button', { name: 'Join Room' }).click();
			await expect(pageB.getByRole('heading', { name: roomName, level: 1 })).toBeVisible({
				timeout: 10_000
			});

			// Both see same lanes (all three retro lanes visible)
			await expect(pageA.getByTestId('retro-lane-went-well')).toBeVisible();
			await expect(pageA.getByTestId('retro-lane-to-improve')).toBeVisible();
			await expect(pageA.getByTestId('retro-lane-action-items')).toBeVisible();
			await expect(pageB.getByTestId('retro-lane-went-well')).toBeVisible();
			await expect(pageB.getByTestId('retro-lane-to-improve')).toBeVisible();
			await expect(pageB.getByTestId('retro-lane-action-items')).toBeVisible();

			// Both see same item (real-time sync; use timeout so Playwright waits for other user's action to appear)
			await expect(pageA.getByText(itemText)).toBeVisible({ timeout: 5_000 });
			await expect(pageB.getByText(itemText)).toBeVisible({ timeout: 10_000 });
			await expect(pageA.getByTestId('retro-item-card').filter({ hasText: itemText })).toBeVisible({
				timeout: 5_000
			});
			await expect(pageB.getByTestId('retro-item-card').filter({ hasText: itemText })).toBeVisible({
				timeout: 10_000
			});
		} finally {
			await contextA.close();
			await contextB.close();
		}
	});
});
