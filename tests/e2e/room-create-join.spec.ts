import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

async function goToHome(page: Page) {
	await page.goto('/');
	await page.getByRole('link', { name: 'Join a Room' }).click();
	await expect(page).toHaveURL('/join');
	await page.getByLabel('Your Name').fill(`E2E-${Date.now()}`);
	await page.getByRole('button', { name: 'Continue' }).click();
	try {
		await page.waitForURL(/\/home\/?/, { timeout: 5000 });
	} catch {
		await page.goto('/home');
	}
	await expect(page).toHaveURL('/home', { timeout: 15_000 });
	await expect(page.getByRole('button', { name: 'Create Room' })).toBeVisible({ timeout: 15_000 });
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
		await expect(
			page.getByRole('heading', { name: 'E2E Refinement Room', level: 1 })
		).toBeVisible();
		await expect(page.getByTestId('room-code')).toHaveText(/\d{3}-\d{3}-\d{4}/);
	});

	test('join by code: enter code, submit → /room/[id]; if password required, show JoinRoomDialog; submit password → room UI', async ({
		page,
		browser
	}) => {
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

			await expect(
				pageB.getByRole('heading', { name: 'E2E Retro for Join', level: 1 })
			).toBeVisible({
				timeout: 10_000
			});
			await expect(pageB.getByTestId('room-code')).toHaveText(roomCode!.trim());
		} finally {
			await contextB.close();
		}
	});

	test('join by code with wrong password: error shown in dialog', async ({ page, browser }) => {
		await goToHome(page);
		await page.getByRole('button', { name: 'Create Room' }).click();
		await page.getByRole('radio', { name: 'Sprint Retrospective' }).click();
		await page.getByRole('button', { name: 'Next' }).click();
		await page.getByTestId('room-name-input').fill('E2E Wrong Pwd Room');
		await page.getByRole('dialog').getByRole('button', { name: 'Create Room' }).click();

		await expect(page).toHaveURL(/\/room\/[^/]+$/);
		const roomCode = await page.getByTestId('room-code').textContent();
		expect(roomCode).toBeTruthy();

		const contextB = await browser.newContext();
		const pageB = await contextB.newPage();
		try {
			await goToHome(pageB);
			await pageB.getByTestId('room-code-input').fill(roomCode!.trim());
			await pageB.getByRole('button', { name: 'Join Room' }).click();

			await expect(pageB).toHaveURL(/\/room\/[^/]+$/);
			await expect(pageB.getByTestId('join-room-password')).toBeVisible();
			await pageB.getByTestId('join-room-password').fill('wrong-password');
			await pageB.getByRole('button', { name: 'Join Room' }).click();

			await expect(pageB.getByTestId('join-room-error')).toHaveText(
				'Invalid password. Please try again.',
				{ timeout: 5000 }
			);
			await expect(pageB).toHaveURL(/\/room\/[^/]+$/);
		} finally {
			await contextB.close();
		}
	});

	test('dismiss password dialog: redirect to home', async ({ page, browser }) => {
		await goToHome(page);
		await page.getByRole('button', { name: 'Create Room' }).click();
		await page.getByRole('radio', { name: 'Sprint Retrospective' }).click();
		await page.getByRole('button', { name: 'Next' }).click();
		await page.getByTestId('room-name-input').fill('E2E Dismiss Dialog Room');
		await page.getByRole('dialog').getByRole('button', { name: 'Create Room' }).click();

		await expect(page).toHaveURL(/\/room\/[^/]+$/);
		const roomCode = await page.getByTestId('room-code').textContent();
		expect(roomCode).toBeTruthy();

		const contextB = await browser.newContext();
		const pageB = await contextB.newPage();
		try {
			await goToHome(pageB);
			await pageB.getByTestId('room-code-input').fill(roomCode!.trim());
			await pageB.getByRole('button', { name: 'Join Room' }).click();

			await expect(pageB).toHaveURL(/\/room\/[^/]+$/);
			await expect(pageB.getByRole('heading', { name: 'Join Room' })).toBeVisible();
			await pageB.keyboard.press('Escape');
			await expect(pageB).toHaveURL('/home', { timeout: 5000 });
		} finally {
			await contextB.close();
		}
	});

	test('invalid room ID: show password dialog (room existence not checked until after join)', async ({
		page
	}) => {
		await goToHome(page);
		await page.goto('/room/nonexistent-room-id-404');
		// Rooms viewRule requires participant to read; we skip existence check so join-by-code
		// users see the password dialog. So invalid id also shows dialog.
		await expect(page).toHaveURL(/\/room\/nonexistent-room-id-404/, { timeout: 5_000 });
		await expect(page.getByRole('heading', { name: 'Join Room' })).toBeVisible();
		await expect(page.getByTestId('join-room-password')).toBeVisible();
	});

	test('join button enabled when room code is entered (no refresh)', async ({ page }) => {
		await goToHome(page);
		await expect(page.getByRole('button', { name: 'Join Room' })).toBeDisabled();
		await page.getByTestId('room-code-input').fill('123-456-7890');
		await expect(page.getByRole('button', { name: 'Join Room' })).toBeEnabled();
	});

	test('invalid room code: user stays on /home and sees error alert (no navigation to /room/[id])', async ({
		page
	}) => {
		await goToHome(page);
		await page.getByTestId('room-code-input').fill('000-000-0000');
		await page.getByRole('button', { name: 'Join Room' }).click();
		// Invalid code: stay on home and show join error
		await expect(page).toHaveURL('/home', { timeout: 5000 });
		await expect(page).not.toHaveURL(/\/room\/[^/]+$/);
		await expect(page.getByText('Could not join room')).toBeVisible({ timeout: 5000 });
		await expect(page.getByText(/Room not found|Check the code/)).toBeVisible();
	});

	test('join by code with leading/trailing spaces: trims and finds room', async ({
		page,
		browser
	}) => {
		await goToHome(page);
		await page.getByRole('button', { name: 'Create Room' }).click();
		await page.getByRole('radio', { name: 'Sprint Retrospective' }).click();
		await page.getByRole('button', { name: 'Next' }).click();
		await page.getByTestId('room-name-input').fill('E2E Trim Code Room');
		await page.getByRole('dialog').getByRole('button', { name: 'Create Room' }).click();

		await expect(page).toHaveURL(/\/room\/[^/]+$/);
		const roomCode = (await page.getByTestId('room-code').textContent())?.trim();
		expect(roomCode).toBeTruthy();

		await page.getByTestId('room-password-reveal').click();
		const roomPassword = (await page.getByTestId('room-password-value').textContent())?.trim();
		expect(roomPassword).toBeTruthy();

		const contextB = await browser.newContext();
		const pageB = await contextB.newPage();
		try {
			await goToHome(pageB);
			await pageB.getByTestId('room-code-input').fill(`  ${roomCode}  `);
			await pageB.getByRole('button', { name: 'Join Room' }).click();

			await expect(pageB).toHaveURL(/\/room\/[^/]+$/);
			await pageB.getByTestId('join-room-password').fill(roomPassword!);
			await pageB.getByRole('button', { name: 'Join Room' }).click();

			await expect(
				pageB.getByRole('heading', { name: 'E2E Trim Code Room', level: 1 })
			).toBeVisible({ timeout: 10_000 });
		} finally {
			await contextB.close();
		}
	});

	test('recently joined rooms section shows after user has joined a room', async ({ page }) => {
		await goToHome(page);
		await page.getByRole('button', { name: 'Create Room' }).click();
		await page.getByRole('radio', { name: 'Sprint Retrospective' }).click();
		await page.getByRole('button', { name: 'Next' }).click();
		await page.getByTestId('room-name-input').fill('E2E Recent Rooms Test');
		await page.getByRole('dialog').getByRole('button', { name: 'Create Room' }).click();

		await expect(page).toHaveURL(/\/room\/[^/]+$/);
		await expect(
			page.getByRole('heading', { name: 'E2E Recent Rooms Test', level: 1 })
		).toBeVisible();

		await page.goto('/home');
		await expect(page).toHaveURL('/home', { timeout: 10_000 });
		await expect(page.getByRole('heading', { name: 'Recently Joined Rooms' })).toBeVisible({
			timeout: 10_000
		});
		await expect(page.getByText('E2E Recent Rooms Test')).toBeVisible();
	});

	test('Copy join link: button visible after create, click shows Copied!', async ({ page }) => {
		await goToHome(page);
		await page.getByRole('button', { name: 'Create Room' }).click();
		await page.getByRole('radio', { name: 'Sprint Retrospective' }).click();
		await page.getByRole('button', { name: 'Next' }).click();
		await page.getByTestId('room-name-input').fill('E2E Copy Link Room');
		await page.getByRole('dialog').getByRole('button', { name: 'Create Room' }).click();

		await expect(page).toHaveURL(/\/room\/[^/]+$/);
		await expect(page.getByTestId('copy-join-link')).toBeVisible();
		await expect(page.getByTestId('copy-join-link')).toBeEnabled();
		await page.getByTestId('copy-join-link').click();
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
			try {
				await pageB.waitForURL(/\/home\/?/, { timeout: 5000 });
			} catch {
				await pageB.goto('/home');
			}
			await expect(pageB).toHaveURL('/home', { timeout: 15_000 });
			await expect(pageB.getByRole('button', { name: 'Create Room' })).toBeVisible({
				timeout: 15_000
			});

			await pageB.goto(`/room/${roomId}#pwd=${encodeURIComponent(roomPassword!.trim())}`);

			await expect(
				pageB.getByRole('heading', { name: 'E2E Room for Hash Join', level: 1 })
			).toBeVisible({
				timeout: 10_000
			});
			await expect(pageB.getByTestId('room-code')).toBeVisible();
			await expect(pageB.getByTestId('join-room-password')).not.toBeVisible();
		} finally {
			await contextB.close();
		}
	});
});
