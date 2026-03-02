import { expect, test } from '@playwright/test';

test.describe('Landing → Join → Home', () => {
	test('open /, click Join/Host → /join; enter name, submit → /home with Welcome, <name>', async ({
		page
	}) => {
		const name = 'SmokeUser';

		await page.goto('/');
		await expect(page).toHaveURL('/');

		await page.getByRole('link', { name: 'Join a Room' }).click();
		await expect(page).toHaveURL('/join');

		await page.getByLabel('Your Name').fill(name);
		await page.getByRole('button', { name: 'Continue' }).click();

		await expect(page).toHaveURL('/home');
		await expect(page.getByText(`Welcome, ${name}`)).toBeVisible();
	});
});
