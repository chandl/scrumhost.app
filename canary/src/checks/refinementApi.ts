import type { Config } from '../config';
import { decryptString, encryptString, randomToken } from '../crypto';
import { createRoom, joinRoom, newClient, signup } from '../pbClient';
import { waitFor } from '../types';

/**
 * Exercises the full backlog-refinement contract exactly as the real client
 * does: two independent identities join the same passphrase-gated room,
 * one posts an E2E-encrypted story and opens it for voting, both cast
 * estimates, and each side's PocketBase realtime subscription must observe
 * the other's writes. This is the closest analog to tmpmail's canary
 * SMTP -> inbox propagation check, just over PocketBase's SSE realtime API.
 */
export async function runRefinementApiCheck(cfg: Config): Promise<void> {
	const token = randomToken();
	const pbA = newClient(cfg.apiUrl);
	const pbB = newClient(cfg.apiUrl);

	await signup(pbA, `${cfg.namePrefix}-refine-a-${token}`);
	await signup(pbB, `${cfg.namePrefix}-refine-b-${token}`);

	const room = await createRoom(pbA, `${cfg.namePrefix} refinement ${token}`, 'REFINEMENT');
	const participantA = await joinRoom(pbA, room.id, room.passcode);

	const refinementMetadata = await pbA.collection('refinement_metadata').create({
		point_values: '0, 1, 2, 3, 5, 8, 13, 21, ?',
		active_story: null,
		room_status: 'IDLE',
		host: participantA.id,
		parent_room: room.id
	});

	// A watches the room record; B joining must show up via realtime, not a re-fetch.
	// subscribe() resolves only once the subscription is registered with the
	// server, so it must be awaited before B's write or the event can be missed.
	let observedParticipantCount = 0;
	await pbA.collection('rooms').subscribe(
		room.id,
		(e) => {
			if (e.action === 'update') {
				observedParticipantCount = (e.record.participants ?? []).length;
			}
		},
		{ fields: 'id,participants' }
	);

	const participantB = await joinRoom(pbB, room.id, room.passcode);

	try {
		await waitFor(
			() => observedParticipantCount >= 2,
			8000,
			150,
			'room realtime update after second participant joins'
		);

		const storyPlaintext = `canary story ${token}`;
		const encryptedDetails = await encryptString(room.passcode, storyPlaintext);
		const story = await pbA.collection('stories').create({
			refinement_metadata: refinementMetadata.id,
			details: encryptedDetails,
			story_status: 'QUEUED',
			author: pbA.authStore.model?.id
		});
		await pbA.collection('refinement_metadata').update(refinementMetadata.id, {
			'stories+': story.id
		});

		// B watches the story's estimates via realtime before A's vote lands.
		let bObservedEstimateCount = 0;
		await pbB.collection('stories').subscribe(
			story.id,
			(e) => {
				if (e.action === 'update') {
					bObservedEstimateCount = (e.record.story_estimates ?? []).length;
				}
			},
			{ fields: 'id,story_estimates' }
		);

		await pbA
			.collection('refinement_metadata')
			.update(refinementMetadata.id, { active_story: story.id, room_status: 'VOTING' });

		const voteA = '5';
		const voteB = '8';
		const estimateA = await pbA.collection('story_estimates').create({
			story: story.id,
			estimate: voteA,
			user: pbA.authStore.model?.id,
			participant: participantA.id
		});
		await pbA.collection('stories').update(story.id, { 'story_estimates+': estimateA.id });

		const estimateB = await pbB.collection('story_estimates').create({
			story: story.id,
			estimate: voteB,
			user: pbB.authStore.model?.id,
			participant: participantB.id
		});
		await pbB.collection('stories').update(story.id, { 'story_estimates+': estimateB.id });

		await waitFor(
			() => bObservedEstimateCount >= 2,
			8000,
			150,
			"story realtime update reflecting both participants' votes"
		);

		const finalStory = await pbA.collection('stories').getOne(story.id, {
			expand: 'story_estimates',
			fields: 'id,details,expand.story_estimates.estimate'
		});
		const decrypted = await decryptString(room.passcode, finalStory.details);
		if (decrypted !== storyPlaintext) {
			throw new Error(
				`decrypted story details = ${JSON.stringify(decrypted)}, want ${JSON.stringify(storyPlaintext)}`
			);
		}
		const estimates = (finalStory.expand?.story_estimates ?? []).map(
			(e: { estimate: string }) => e.estimate
		);
		for (const want of [voteA, voteB]) {
			if (!estimates.includes(want)) {
				throw new Error(`story estimates = ${JSON.stringify(estimates)}, want to include ${want}`);
			}
		}
	} finally {
		await pbA.collection('rooms').unsubscribe();
		await pbB.collection('stories').unsubscribe();
	}
}
