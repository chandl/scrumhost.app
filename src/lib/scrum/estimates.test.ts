import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockPb, resetPocketBaseMock } from '../../test/pocketbase-mock';

vi.mock('$lib/pocketbase/pocketbase', async () => {
	const { mockPb } = await import('../../test/pocketbase-mock');
	return { default: mockPb };
});

import { getEstimateByStoryAndUser, createOrUpdateEstimate, deleteEstimates } from './estimates';

describe('estimates', () => {
	beforeEach(() => {
		resetPocketBaseMock();
	});

	describe('getEstimateByStoryAndUser', () => {
		it('returns estimate when one exists for story and user', async () => {
			await mockPb.collection('story_estimates').create({
				story: 'story-1',
				user: 'user-1',
				estimate: '5',
				participant: 'part-1'
			});
			const second = await mockPb.collection('story_estimates').create({
				story: 'story-1',
				user: 'user-2',
				estimate: '3',
				participant: 'part-2'
			});
			const result = await getEstimateByStoryAndUser('story-1', 'user-2');
			expect(result).toBeDefined();
			expect(result?.id).toBe(second.id);
			expect(result?.story).toBe('story-1');
			expect(result?.user).toBe('user-2');
			expect(result?.estimate).toBe('3');
		});

		it('returns undefined when no estimate matches', async () => {
			const result = await getEstimateByStoryAndUser('story-1', 'user-1');
			expect(result).toBeUndefined();
		});
	});

	describe('createOrUpdateEstimate', () => {
		it('creates new estimate when none exists (create path)', async () => {
			mockPb.authStore.model = { id: 'user-1' } as never;
			const storyRecord = await mockPb.collection('stories').create({
				details: 'Story 1',
				story_status: 'QUEUED',
				story_estimates: []
			});
			const storyId = storyRecord.id;

			const result = await createOrUpdateEstimate('part-1', storyId, '5');
			expect(result).toBeDefined();
			expect(result.id).toBeDefined();
			expect(typeof result.storyId).toBe('undefined');
			expect(result.estimate).toBeUndefined();
			expect(result.user).toBeUndefined();
			expect(result.participant).toBeUndefined();

			const estimatesColl = mockPb.collection('story_estimates') as ReturnType<
				typeof mockPb.collection
			> & { create: ReturnType<typeof vi.fn> };
			expect(estimatesColl.create).toHaveBeenCalledWith(
				expect.objectContaining({
					story: storyId,
					estimate: '5',
					user: 'user-1',
					participant: 'part-1'
				})
			);
			const story = await mockPb.collection('stories').getOne(storyId);
			expect(Array.isArray(story.story_estimates)).toBe(true);
			expect((story.story_estimates as string[]).includes(result.id)).toBe(true);
		});

		it('updates existing estimate when one exists (update path)', async () => {
			mockPb.authStore.model = { id: 'user-1' } as never;
			const storyRecord = await mockPb.collection('stories').create({
				details: 'Story 1',
				story_status: 'QUEUED',
				story_estimates: []
			});
			const storyId = storyRecord.id;
			const existing = await mockPb.collection('story_estimates').create({
				story: storyId,
				user: 'user-1',
				estimate: '3',
				participant: 'part-1'
			});
			await mockPb.collection('stories').update(storyId, {
				'story_estimates+': existing.id
			});

			const result = await createOrUpdateEstimate('part-1', storyId, '8');
			expect(result).toBeDefined();
			expect(result.id).toBe(existing.id);

			const estimatesColl = mockPb.collection('story_estimates') as ReturnType<
				typeof mockPb.collection
			> & { update: ReturnType<typeof vi.fn> };
			expect(estimatesColl.update).toHaveBeenCalledWith(
				existing.id,
				expect.objectContaining({
					estimate: '8'
				})
			);
		});
	});

	describe('deleteEstimates', () => {
		it('deletes each estimate and removes their ids from story', async () => {
			const storyRecord = await mockPb.collection('stories').create({
				details: 'Story 1',
				story_status: 'QUEUED',
				story_estimates: []
			});
			const storyId = storyRecord.id;
			const est1 = await mockPb.collection('story_estimates').create({
				story: storyId,
				user: 'user-1',
				estimate: '5',
				participant: 'part-1'
			});
			const est2 = await mockPb.collection('story_estimates').create({
				story: storyId,
				user: 'user-2',
				estimate: '3',
				participant: 'part-2'
			});
			await mockPb.collection('stories').update(storyId, {
				'story_estimates+': est1.id
			});
			await mockPb.collection('stories').update(storyId, {
				'story_estimates+': est2.id
			});

			const currentEstimates = [
				{ id: est1.id, storyId, estimate: '5', user: 'user-1', participant: 'part-1' },
				{ id: est2.id, storyId, estimate: '3', user: 'user-2', participant: 'part-2' }
			];

			await deleteEstimates(storyId, currentEstimates);

			const estimatesColl = mockPb.collection('story_estimates') as ReturnType<
				typeof mockPb.collection
			> & { delete: ReturnType<typeof vi.fn> };
			expect(estimatesColl.delete).toHaveBeenCalledWith(est1.id);
			expect(estimatesColl.delete).toHaveBeenCalledWith(est2.id);

			const storiesColl = mockPb.collection('stories') as ReturnType<typeof mockPb.collection> & {
				update: ReturnType<typeof vi.fn>;
			};
			expect(storiesColl.update).toHaveBeenCalledWith(storyId, {
				'story_estimates-': [est1.id, est2.id]
			});

			await expect(mockPb.collection('story_estimates').getOne(est1.id)).rejects.toThrow();
			await expect(mockPb.collection('story_estimates').getOne(est2.id)).rejects.toThrow();
		});
	});
});
