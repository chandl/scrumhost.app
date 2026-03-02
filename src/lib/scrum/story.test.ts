import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockPb, resetPocketBaseMock } from '../../test/pocketbase-mock';

vi.mock('$lib/pocketbase/pocketbase', async () => {
	const { mockPb } = await import('../../test/pocketbase-mock');
	return { default: mockPb };
});

import { createStory, getStoryWithEstimatesById, setStoryStatus } from './story';

describe('story', () => {
	beforeEach(() => {
		resetPocketBaseMock();
	});

	describe('createStory', () => {
		it('creates story and appends id to refinement_metadata stories', async () => {
			mockPb.authStore.model = { id: 'user-1', name: 'Alice' } as never;
			const refinementRecord = await mockPb.collection('refinement_metadata').create({
				parent_room: 'room-1',
				point_values: '1,2,3',
				active_story: '',
				room_status: 'IDLE',
				host: 'user-1',
				stories: []
			});
			const refinementId = refinementRecord.id;

			const result = await createStory('As a user I want X', refinementId);

			expect(result.id).toBeDefined();
			expect(result.details).toBe('As a user I want X');
			expect(result.story_status).toBe('QUEUED');
			expect(result.refinement_metadata).toBe(refinementId);
			expect(result.author).toBe('user-1');

			const storiesColl = mockPb.collection('stories');
			expect(storiesColl.create).toHaveBeenCalledWith(
				expect.objectContaining({
					refinement_metadata: refinementId,
					details: 'As a user I want X',
					story_status: 'QUEUED',
					author: 'user-1'
				})
			);
			expect(mockPb.collection('refinement_metadata').update).toHaveBeenCalledWith(
				refinementId,
				{ 'stories+': result.id }
			);
		});

		it('sets author to undefined when authStore has no model', async () => {
			mockPb.authStore.model = null;
			const refinementRecord = await mockPb.collection('refinement_metadata').create({
				parent_room: 'room-1',
				point_values: '1,2,3',
				active_story: '',
				room_status: 'IDLE',
				host: '',
				stories: []
			});

			const result = await createStory('Anonymous story', refinementRecord.id);

			expect(result.author).toBeUndefined();
			expect(mockPb.collection('stories').create).toHaveBeenCalledWith(
				expect.objectContaining({
					details: 'Anonymous story',
					story_status: 'QUEUED',
					author: undefined
				})
			);
		});
	});

	describe('getStoryWithEstimatesById', () => {
		it('returns story with estimates shape when found', async () => {
			const storyId = 'story-1';
			const estimates = [
				{ id: 'e1', participant: 'p1', user: 'u1', estimate: '5' },
				{ id: 'e2', participant: 'p2', user: 'u2', estimate: '3' }
			];
			const storiesColl = mockPb.collection('stories');
			vi.mocked(storiesColl.getOne).mockResolvedValueOnce({
				id: storyId,
				details: 'Fix login',
				story_status: 'QUEUED',
				updated: '2025-01-15T12:00:00Z',
				expand: { story_estimates: estimates }
			} as never);

			const result = await getStoryWithEstimatesById(storyId);

			expect(result).toEqual({
				id: storyId,
				details: 'Fix login',
				story_status: 'QUEUED',
				story_estimates: estimates,
				updated: '2025-01-15T12:00:00Z'
			});
			expect(storiesColl.getOne).toHaveBeenCalledWith(
				storyId,
				expect.objectContaining({ expand: 'story_estimates' })
			);
		});

		it('returns story with undefined story_estimates when expand missing', async () => {
			const storyId = 'story-2';
			const storiesColl = mockPb.collection('stories');
			vi.mocked(storiesColl.getOne).mockResolvedValueOnce({
				id: storyId,
				details: 'No estimates yet',
				story_status: 'REVIEWED',
				updated: '2025-01-15T12:00:00Z'
			} as never);

			const result = await getStoryWithEstimatesById(storyId);

			expect(result.id).toBe(storyId);
			expect(result.details).toBe('No estimates yet');
			expect(result.story_status).toBe('REVIEWED');
			expect(result.story_estimates).toBeUndefined();
			expect(result.updated).toBe('2025-01-15T12:00:00Z');
		});

		it('throws when story is not found', async () => {
			const storiesColl = mockPb.collection('stories');
			vi.mocked(storiesColl.getOne).mockRejectedValueOnce(new Error('Record not found'));

			await expect(getStoryWithEstimatesById('missing')).rejects.toThrow('Record not found');
		});
	});

	describe('setStoryStatus', () => {
		it('updates story status via collection update', async () => {
			const storyRecord = await mockPb.collection('stories').create({
				details: 'Story',
				story_status: 'QUEUED',
				refinement_metadata: 'ref-1'
			});
			const storyId = storyRecord.id;

			await setStoryStatus(storyId, 'REVIEWED');

			expect(mockPb.collection('stories').update).toHaveBeenCalledWith(
				storyId,
				{ story_status: 'REVIEWED' }
			);
			const updated = await mockPb.collection('stories').getOne(storyId);
			expect(updated.story_status).toBe('REVIEWED');
		});

		it('supports QUEUED, REVIEWED, SKIPPED', async () => {
			const storyRecord = await mockPb.collection('stories').create({
				details: 'Story',
				story_status: 'REVIEWED',
				refinement_metadata: 'ref-1'
			});

			await setStoryStatus(storyRecord.id, 'SKIPPED');
			expect(mockPb.collection('stories').update).toHaveBeenCalledWith(
				storyRecord.id,
				{ story_status: 'SKIPPED' }
			);
		});

		it('throws when update fails', async () => {
			vi.mocked(mockPb.collection('stories').update).mockRejectedValueOnce(
				new Error('Record not found')
			);

			await expect(setStoryStatus('missing-id', 'REVIEWED')).rejects.toThrow(
				'Record not found'
			);
		});
	});
});
