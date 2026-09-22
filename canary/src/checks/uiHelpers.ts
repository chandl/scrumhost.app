import type { Page } from 'playwright';

/** Signs a fresh identity in via the real /join flow and lands on /home, exactly like a first-time visitor. */
export async function goToHome(page: Page, appUrl: string, name: string): Promise<void> {
	await page.goto(appUrl + '/');
	await page.getByRole('link', { name: 'Join a Room' }).click();
	await page.waitForURL(/\/join\/?$/);
	await page.getByLabel('Your Name').fill(name);
	await page.getByRole('button', { name: 'Continue' }).click();
	try {
		await page.waitForURL(/\/home\/?/, { timeout: 5000 });
	} catch {
		await page.goto(appUrl + '/home');
	}
	await page.waitForURL(/\/home\/?$/, { timeout: 15_000 });
	await page
		.getByRole('button', { name: 'Create Room' })
		.waitFor({ state: 'visible', timeout: 15_000 });
}

export async function createRoom(
	page: Page,
	roomTypeLabel: 'Backlog Refinement (Planning Poker)' | 'Sprint Retrospective',
	roomName: string
): Promise<{ roomCode: string; roomPassword: string }> {
	await page.getByRole('button', { name: 'Create Room' }).click();
	await page.getByRole('radio', { name: roomTypeLabel }).click();
	await page.getByRole('button', { name: 'Next' }).click();
	await page.getByTestId('room-name-input').fill(roomName);
	await page.getByRole('dialog').getByRole('button', { name: 'Create Room' }).click();
	await page.waitForURL(/\/room\/[^/]+$/);
	await page.getByRole('heading', { name: roomName, level: 1 }).waitFor({ state: 'visible' });

	await page.getByTestId('room-password-reveal').click();
	const roomCode = (await page.getByTestId('room-code').textContent())?.trim();
	const roomPassword = (await page.getByTestId('room-password-value').textContent())?.trim();
	if (!roomCode || !roomPassword) {
		throw new Error('room code or password was not rendered after room creation');
	}
	return { roomCode, roomPassword };
}

export async function joinRoom(page: Page, roomCode: string, roomPassword: string): Promise<void> {
	await page.getByTestId('room-code-input').fill(roomCode);
	await page.getByRole('button', { name: 'Join Room' }).click();
	await page.waitForURL(/\/room\/[^/]+$/);
	await page.getByTestId('join-room-password').waitFor({ state: 'visible' });
	await page.getByTestId('join-room-password').fill(roomPassword);
	await page.getByRole('button', { name: 'Join Room' }).click();
}

export async function assertVisible(page: Page, testId: string, timeout = 10_000): Promise<void> {
	await page.getByTestId(testId).waitFor({ state: 'visible', timeout });
}

export async function assertTextVisible(page: Page, text: string, timeout = 10_000): Promise<void> {
	await page.getByText(text).first().waitFor({ state: 'visible', timeout });
}
