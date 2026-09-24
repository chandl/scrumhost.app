import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

async function goToHome(page: Page) {
	await page.goto('/');
	await page.getByRole('link', { name: 'Join a Room' }).click();
	await expect(page).toHaveURL('/join');
	await page.getByLabel('Your Name').fill(`E2E-Refinement-${Date.now()}`);
	await page.getByRole('button', { name: 'Continue' }).click();
	try {
		await page.waitForURL(/\/home\/?/, { timeout: 5000 });
	} catch {
		await page.goto('/home');
	}
	await expect(page).toHaveURL('/home', { timeout: 15_000 });
	await expect(page.getByRole('button', { name: 'Create Room' })).toBeVisible({ timeout: 15_000 });
}

async function createRefinementRoom(page: Page) {
	await page.getByRole('button', { name: 'Create Room' }).click();
	await page.getByRole('radio', { name: 'Backlog Refinement (Planning Poker)' }).click();
	await page.getByRole('button', { name: 'Next' }).click();
	await page.getByTestId('room-name-input').fill('E2E Refinement Room');
	await page.getByRole('dialog').getByRole('button', { name: 'Create Room' }).click();
	await expect(page).toHaveURL(/\/room\/[^/]+$/);
	await expect(page.getByRole('heading', { name: 'E2E Refinement Room', level: 1 })).toBeVisible();
}

test.describe('Refinement (single user)', () => {
	test('create task, open it, vote, reveal', async ({ page }) => {
		await goToHome(page);
		await createRefinementRoom(page);

		// Create a task (story)
		const taskTitle = 'E2E refinement task';
		await page.getByTestId('create-task-input').fill(taskTitle);
		await page.getByTestId('create-task-submit').click();

		// Ensure Queued tab is selected and task appears, then open it (Start Voting)
		await page.getByRole('tab', { name: /Queued/ }).click();
		await expect(page.getByRole('tabpanel').getByTestId('task-list').first()).toBeVisible({
			timeout: 10_000
		});
		await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 5_000 });
		await page.getByTestId('start-voting').first().click();

		// Vote for active task (default point set includes 0,1,2,3,...)
		await expect(page.getByTestId('voting-buttons')).toBeVisible({ timeout: 5_000 });
		await page.getByTestId('vote-3').click();

		// Reveal: Start Reviewing
		await page.getByTestId('start-reviewing').click();

		// After reveal, Vote Summary is shown
		await expect(page.getByTestId('vote-summary')).toBeVisible({ timeout: 10_000 });
		await expect(page.getByText('Vote Summary')).toBeVisible();
	});
});

test.describe('Refinement: changing a vote', () => {
	test('changed vote stays selected and is the one revealed', async ({ page }) => {
		await goToHome(page);
		await createRefinementRoom(page);

		await page.getByTestId('create-task-input').fill('E2E change vote task');
		await page.getByTestId('create-task-submit').click();
		await page.getByTestId('start-voting').first().click();
		await expect(page.getByTestId('voting-buttons')).toBeVisible({ timeout: 10_000 });

		// First vote, wait until the server has it (Reveal is enabled once a vote exists)
		await page.getByTestId('vote-3').click();
		await expect(page.getByTestId('start-reviewing')).toBeEnabled({ timeout: 10_000 });

		// Change the vote; it must stay selected after the save and realtime refresh settle
		await page.getByTestId('vote-5').click();
		await expect(page.getByTestId('vote-5')).toHaveAttribute('aria-pressed', 'true');
		await page.waitForTimeout(1500);
		await expect(page.getByTestId('vote-5')).toHaveAttribute('aria-pressed', 'true');
		await expect(page.getByTestId('vote-3')).toHaveAttribute('aria-pressed', 'false');
		// Server-backed vote (participant list) reflects the change via the realtime refresh
		await expect(page.getByTestId('participant-item').filter({ hasText: '(You)' })).toContainText(
			'5',
			{ timeout: 5_000 }
		);

		// Reveal shows only the changed vote (one vote, value 5)
		await page.getByTestId('start-reviewing').click();
		const summary = page.getByTestId('vote-summary');
		await expect(summary).toBeVisible({ timeout: 10_000 });
		await expect(summary).toContainText('1 vote from');
		await expect(summary.locator('li')).toHaveCount(1);
		await expect(summary.locator('li')).toContainText('5');
	});
});
