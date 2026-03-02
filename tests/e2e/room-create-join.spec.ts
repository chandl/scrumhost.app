import { expect, test } from '@playwright/test';

async function goToHome(page: { goto: (url: string) => Promise<void>; getByRole: (role: string, opts?: { name: string }) => any; getByLabel: (label: string) => any }) {
	await page.goto('/');
	await page.getByRole('link', { name: 'Join a Room' }).click();
	await expect(page).toHaveURL('/join');
	await page.getByLabel('Your Name').fill(`E2E-${Date.now()}`);
	await page.getByRole('button', { name: 'Continue' }).click();
	await expect(page).toHaveURL('/home');
}

test.describe('Create / Join room', () => {
	test('create room: fill name, choose type, submit → /room/[id], see room name and code', async ({
		page
	}) => {
		await goToHome(page);

		await page.getByRole('button', { name: 'Create Room' }).click();
		await page.getByRole('radio', { name: 'Backlog Refinement (Planning Poker)' }).click();
		await page.getByRole('button', { name: 'Next' }).click();
		await page.getByTestId('room-name-input').fill('E2E Refinement Room');
		await page.getByRole('dialog').getByRole('button', { name: 'Create Room' }).click();

		await expect(page).toHaveURL(/\/room\/[^/]+$/);
		await expect(page.getByRole('heading', { name: 'E2E Refinement Room', level: 1 })).toBeVisible();
		await expect(page.getByTestId('room-code')).toHaveText(/\d{3}-\d{3}-\d{4}/);
	});

	test('join by code: enter code, submit → /room/[id]; if password required, show JoinRoomDialog; submit password → room UI', async ({ page, browser }) => {
		// User A: create room and get code + password
		await goToHome(page);
		await page.getByRole('button', { name: 'Create Room' }).click();
		await page.getByRole('radio', { name: 'Sprint Retrospective' }).click();
		await page.getByRole('button', { name: 'Next' }).click();
		await page.getByTestId('room-name-input').fill('E2E Retro for Join');
		await page.getByRole('dialog').getByRole('button', { name: 'Create Room' }).click();

		await expect(page).toHaveURL(/\/room\/[^/]+$/);
		const roomCode = await page.getByTestId('room-code').textContent();
		expect(roomCode).toBeTruthy();

		// Reveal password to read it for User B
		await page.getByTestId('room-password-reveal').click();
		const roomPassword = await page.getByTestId('room-password-value').textContent();
		expect(roomPassword).toBeTruthy();

		// User B: join by code, see JoinRoomDialog, enter password, see room UI
		const contextB = await browser.newContext();
		const pageB = await contextB.newPage();
		try {
			await goToHome(pageB);
			await pageB.getByTestId('room-code-input').fill(roomCode!.trim());
			await pageB.getByRole('button', { name: 'Join Room' }).click();

			await expect(pageB).toHaveURL(/\/room\/[^/]+$/);
			await expect(pageB.getByTestId('join-room-password')).toBeVisible();
			await expect(pageB.getByRole('heading', { name: 'Join Room' })).toBeVisible();

			await pageB.getByTestId('join-room-password').fill(roomPassword!.trim());
			await pageB.getByRole('button', { name: 'Join Room' }).click();

			await expect(pageB.getByRole('heading', { name: 'E2E Retro for Join', level: 1 })).toBeVisible({
				timeout: 10_000
			});
			await expect(pageB.getByTestId('room-code')).toHaveText(roomCode!.trim());
		} finally {
			await contextB.close();
		}
	});

	test('room URL with #pwd=<password> → join and see room UI', async ({ page, browser }) => {
		// User A: create room, reveal password, get id and password
		await goToHome(page);
		await page.getByRole('button', { name: 'Create Room' }).click();
		await page.getByRole('radio', { name: 'Sprint Retrospective' }).click();
		await page.getByRole('button', { name: 'Next' }).click();
		await page.getByTestId('room-name-input').fill('E2E Room for Hash Join');
		await page.getByRole('dialog').getByRole('button', { name: 'Create Room' }).click();

		await expect(page).toHaveURL(/\/room\/([^/]+)$/);
		const roomPath = new URL(page.url()).pathname;
		const roomId = roomPath.replace('/room/', '');

		await page.getByTestId('room-password-reveal').click();
		const roomPassword = await page.getByTestId('room-password-value').textContent();
		expect(roomPassword).toBeTruthy();

		// User B: open room URL with #pwd= → join and see room UI (no dialog)
		const contextB = await browser.newContext();
		const pageB = await contextB.newPage();
		try {
			await pageB.goto('/');
			await pageB.getByRole('link', { name: 'Join a Room' }).click();
			await pageB.getByLabel('Your Name').fill(`HashJoin-${Date.now()}`);
			await pageB.getByRole('button', { name: 'Continue' }).click();
			await expect(pageB).toHaveURL('/home');

			await pageB.goto(`/room/${roomId}#pwd=${encodeURIComponent(roomPassword!.trim())}`);

			await expect(pageB.getByRole('heading', { name: 'E2E Room for Hash Join', level: 1 })).toBeVisible({
				timeout: 10_000
			});
			await expect(pageB.getByTestId('room-code')).toBeVisible();
			await expect(pageB.getByTestId('join-room-password')).not.toBeVisible();
		} finally {
			await contextB.close();
		}
	});
});
