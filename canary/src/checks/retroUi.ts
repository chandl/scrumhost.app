import { chromium } from 'playwright';
import type { Config } from '../config';
import { randomToken } from '../crypto';
import { assertTextVisible, assertVisible, createRoom, goToHome, joinRoom } from './uiHelpers';

/**
 * Drives the real rendered app in two browser contexts to confirm the
 * retro board UI reflects a cross-user item in realtime. Adapted from
 * tests/e2e/multi-user.spec.ts.
 */
export async function runRetroUiCheck(cfg: Config): Promise<void> {
	const token = randomToken();
	const nameA = `${cfg.namePrefix}-ui-retro-a-${token}`;
	const nameB = `${cfg.namePrefix}-ui-retro-b-${token}`;
	const roomName = `${cfg.namePrefix} ui retro ${token}`;
	const itemText = `${cfg.namePrefix} ui retro item ${token}`;

	const browser = await chromium.launch();
	try {
		const contextA = await browser.newContext();
		const contextB = await browser.newContext();
		const pageA = await contextA.newPage();
		const pageB = await contextB.newPage();

		try {
			await goToHome(pageA, cfg.appUrl, nameA);
			const { roomCode, roomPassword } = await createRoom(pageA, 'Sprint Retrospective', roomName);

			const laneA = pageA.getByTestId('retro-lane-went-well');
			await laneA.waitFor({ state: 'visible', timeout: 10_000 });
			await laneA.getByTestId('retro-lane-add-input').fill(itemText);
			await laneA.getByTestId('retro-lane-add-submit').click();
			await assertTextVisible(pageA, itemText);

			await goToHome(pageB, cfg.appUrl, nameB);
			await joinRoom(pageB, roomCode, roomPassword);
			await pageB.getByRole('heading', { name: roomName, level: 1 }).waitFor({
				state: 'visible',
				timeout: 10_000
			});

			for (const testId of [
				'retro-lane-went-well',
				'retro-lane-to-improve',
				'retro-lane-action-items'
			]) {
				await assertVisible(pageA, testId);
				await assertVisible(pageB, testId);
			}

			await assertTextVisible(pageB, itemText, 10_000);
		} finally {
			await contextA.close();
			await contextB.close();
		}
	} finally {
		await browser.close();
	}
}
