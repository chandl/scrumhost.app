import { chromium } from 'playwright';
import type { Config } from '../config';
import { randomToken } from '../crypto';
import { assertTextVisible, assertVisible, createRoom, goToHome, joinRoom } from './uiHelpers';

/**
 * Drives the real rendered app in two browser contexts to confirm the
 * refinement UI (not just the API) reflects a cross-user voting round --
 * catches frontend build/hydration/deploy regressions that an API-only
 * check would miss. Adapted from tests/e2e/multi-user.spec.ts.
 */
export async function runRefinementUiCheck(cfg: Config): Promise<void> {
	const token = randomToken();
	const nameA = `${cfg.namePrefix}-ui-refine-a-${token}`;
	const nameB = `${cfg.namePrefix}-ui-refine-b-${token}`;
	const roomName = `${cfg.namePrefix} ui refinement ${token}`;
	const taskTitle = `${cfg.namePrefix} ui task ${token}`;
	const voteA = '3';
	const voteB = '5';

	const browser = await chromium.launch();
	try {
		const contextA = await browser.newContext();
		const contextB = await browser.newContext();
		const pageA = await contextA.newPage();
		const pageB = await contextB.newPage();

		try {
			await goToHome(pageA, cfg.appUrl, nameA);
			const { roomCode, roomPassword } = await createRoom(
				pageA,
				'Backlog Refinement (Planning Poker)',
				roomName
			);

			await pageA.getByTestId('create-task-input').fill(taskTitle);
			await pageA.getByTestId('create-task-submit').click();
			await pageA.getByRole('tab', { name: /Queued/ }).click();
			await assertTextVisible(pageA, taskTitle);
			await pageA.getByTestId('start-voting').first().click();
			await assertVisible(pageA, 'voting-buttons', 15_000);
			await pageA.getByTestId(`vote-${voteA}`).click();

			await goToHome(pageB, cfg.appUrl, nameB);
			await joinRoom(pageB, roomCode, roomPassword);
			await pageB.getByRole('heading', { name: roomName, level: 1 }).waitFor({
				state: 'visible',
				timeout: 10_000
			});
			await assertVisible(pageB, 'voting-buttons', 15_000);
			await assertTextVisible(pageB, taskTitle);
			await pageB.getByTestId(`vote-${voteB}`).click();

			await pageA.getByTestId('start-reviewing').click();

			await assertVisible(pageA, 'vote-summary');
			await assertVisible(pageB, 'vote-summary');
			await assertTextVisible(pageA, voteA);
			await assertTextVisible(pageA, voteB);
			await assertTextVisible(pageB, voteA);
			await assertTextVisible(pageB, voteB);
		} finally {
			await contextA.close();
			await contextB.close();
		}
	} finally {
		await browser.close();
	}
}
