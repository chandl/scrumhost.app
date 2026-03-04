import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

async function goToHome(page: Page) {
	await page.goto('/');
	await page.getByRole('link', { name: 'Join a Room' }).click();
	await expect(page).toHaveURL('/join');
	await page.getByLabel('Your Name').fill(`E2E-Retro-${Date.now()}`);
	await page.getByRole('button', { name: 'Continue' }).click();
	try {
		await page.waitForURL(/\/home\/?/, { timeout: 5000 });
	} catch {
		await page.goto('/home');
	}
	await expect(page).toHaveURL('/home', { timeout: 15_000 });
	await expect(page.getByRole('button', { name: 'Create Room' })).toBeVisible({ timeout: 15_000 });
}

async function createRetrospectiveRoom(page: Page) {
	await page.getByRole('button', { name: 'Create Room' }).click();
	await page.getByRole('radio', { name: 'Sprint Retrospective' }).click();
	await page.getByRole('button', { name: 'Next' }).click();
	await page.getByTestId('room-name-input').fill('E2E Retro Room');
	await page.getByRole('dialog').getByRole('button', { name: 'Create Room' }).click();
	await expect(page).toHaveURL(/\/room\/[^/]+$/);
	await expect(page.getByRole('heading', { name: 'E2E Retro Room', level: 1 })).toBeVisible();
}

test.describe('Retrospective (single user)', () => {
	test('add item to a lane, add comment', async ({ page }) => {
		await goToHome(page);
		await createRetrospectiveRoom(page);

		// Add item to "What Went Well" lane
		const lane = page.getByTestId('retro-lane-went-well');
		await expect(lane).toBeVisible({ timeout: 10_000 });
		const itemText = 'E2E retro went well item';
		await lane.getByTestId('retro-lane-add-input').fill(itemText);
		await lane.getByTestId('retro-lane-add-submit').click();

		// Item appears in the lane
		await expect(page.getByText(itemText)).toBeVisible({ timeout: 10_000 });
		await expect(page.getByTestId('retro-item-card')).toHaveCount(1, { timeout: 5_000 });

		// Open comments on the item and add a comment
		await page.getByTestId('retro-item-comment-toggle').click();
		const commentText = 'E2E retro comment';
		await page.getByTestId('retro-comment-input').fill(commentText);
		await page.getByTestId('retro-comment-submit').click();

		// Comment is visible
		await expect(page.getByText(commentText)).toBeVisible({ timeout: 10_000 });
	});
});
