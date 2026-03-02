import { expect, test } from '@playwright/test';

async function goToHome(page: {
	goto: (url: string) => Promise<void>;
	getByRole: (role: string, opts?: { name: string }) => any;
	getByLabel: (label: string) => any;
}) {
	await page.goto('/');
	await page.getByRole('link', { name: 'Join a Room' }).click();
	await expect(page).toHaveURL('/join');
	await page.getByLabel('Your Name').fill(`E2E-Refinement-${Date.now()}`);
	await page.getByRole('button', { name: 'Continue' }).click();
	await expect(page).toHaveURL('/home');
}

async function createRefinementRoom(page: {
	getByRole: (role: string, opts?: { name: string }) => any;
	getByTestId: (id: string) => any;
}) {
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
		await expect(page.getByTestId('task-list')).toBeVisible({ timeout: 10_000 });
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
