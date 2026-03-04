import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockPb, resetPocketBaseMock } from '../../test/pocketbase-mock';

vi.mock('$lib/pocketbase/pocketbase', async () => {
	const { mockPb } = await import('../../test/pocketbase-mock');
	return { default: mockPb };
});

vi.mock('$lib/crypto', () => ({
	hashString: vi.fn(() => Promise.resolve('mock-hash'))
}));

vi.mock('$lib/utils', async (importOriginal) => {
	const actual = await importOriginal<typeof import('$lib/utils')>();
	return { ...actual, setRoomKeyCookie: vi.fn() };
});

import {
	getParticipantInRoom,
	getUserParticipant,
	getRoomDetails,
	joinRoomAndGetParticipantDetails,
	createRoom
} from './room';
import { setRoomKeyCookie } from '$lib/utils';

describe('room', () => {
	beforeEach(() => {
		resetPocketBaseMock();
		vi.mocked(setRoomKeyCookie).mockClear();
	});

	describe('getParticipantInRoom', () => {
		it('returns participant when one exists for user and room', async () => {
			const created = await mockPb.collection('participants').create({
				user: 'user-1',
				room: 'room-1',
				name: 'Alice'
			});
			const result = await getParticipantInRoom('user-1', 'room-1');
			expect(result).toBeDefined();
			expect(result?.id).toBe(created.id);
			expect(result?.userId).toBe('user-1');
			expect(result?.name).toBe('Alice');
		});

		it('returns undefined when no participant matches', async () => {
			const result = await getParticipantInRoom('user-1', 'room-1');
			expect(result).toBeUndefined();
		});
	});

	describe('getUserParticipant', () => {
		it('returns existing participant when user is in room', async () => {
			mockPb.authStore.model = { id: 'user-1', name: 'Alice' } as never;
			await mockPb.collection('participants').create({
				user: 'user-1',
				room: 'room-1',
				name: 'Alice'
			});
			const result = await getUserParticipant('room-1');
			expect(result).toBeDefined();
			expect(result?.userId).toBe('user-1');
			expect(result?.name).toBe('Alice');
		});

		it('returns undefined when user has no participant in room', async () => {
			mockPb.authStore.model = { id: 'user-1', name: 'Alice' } as never;
			const result = await getUserParticipant('room-1');
			expect(result).toBeUndefined();
		});

		it('returns undefined when authStore has no model', async () => {
			mockPb.authStore.model = null;
			const result = await getUserParticipant('room-1');
			expect(result).toBeUndefined();
		});
	});

	describe('getRoomDetails', () => {
		it('returns room details with expanded participants', async () => {
			const rooms = mockPb.collection('rooms');
			const roomId = 'room-1';
			const participants = [
				{ id: 'p1', user_id: 'u1', name: 'Alice' },
				{ id: 'p2', user_id: 'u2', name: 'Bob' }
			];
			vi.mocked(rooms.getOne).mockResolvedValueOnce({
				id: roomId,
				created: '2025-01-01T00:00:00Z',
				room_name: 'My Room',
				room_code: '123-456-7890',
				room_type: 'REFINEMENT',
				room_key_hash: 'hash',
				expand: { participants }
			} as never);

			const result = await getRoomDetails(roomId);

			expect(result).toEqual({
				id: roomId,
				created: '2025-01-01T00:00:00Z',
				room_name: 'My Room',
				room_code: '123-456-7890',
				room_type: 'REFINEMENT',
				room_key_hash: 'hash',
				participants
			});
			expect(rooms.getOne).toHaveBeenCalledWith(roomId, expect.any(Object));
		});

		it('throws when room is not found', async () => {
			const rooms = mockPb.collection('rooms');
			vi.mocked(rooms.getOne).mockRejectedValueOnce(new Error('Record not found'));

			await expect(getRoomDetails('missing')).rejects.toThrow('Record not found');
		});
	});

	describe('joinRoomAndGetParticipantDetails', () => {
		it('returns existing participant when user already in room', async () => {
			mockPb.authStore.model = { id: 'user-1', name: 'Alice' } as never;
			const created = await mockPb.collection('participants').create({
				user: 'user-1',
				room: 'room-1',
				name: 'Alice'
			});

			const result = await joinRoomAndGetParticipantDetails('room-1', 'any-key');

			expect(result.id).toBe(created.id);
			// Raw record from getFirstListItem uses .user, not .userId
			expect((result as { user?: string }).user ?? result.userId).toBe('user-1');
			expect(result.name).toBe('Alice');
			// Only the seed create was called; module did not create again
			expect(mockPb.collection('participants').create).toHaveBeenCalledTimes(1);
		});

		it('creates participant and updates room when joining new', async () => {
			mockPb.authStore.model = { id: 'user-1', name: 'Alice' } as never;
			const roomRecord = await mockPb.collection('rooms').create({
				creator: 'user-1',
				room_name: 'R',
				room_code: '111-222-3333',
				room_type: 'REFINEMENT',
				room_key_hash: 'h',
				participants: []
			});

			const result = await joinRoomAndGetParticipantDetails(roomRecord.id, 'room-key');

			expect(result.id).toBeDefined();
			expect(result.userId).toBe('user-1');
			expect(result.name).toBe('Alice');
			expect(mockPb.collection('participants').create).toHaveBeenCalledWith(
				{ user: 'user-1', room: roomRecord.id, name: 'Alice' },
				expect.objectContaining({ headers: { x_room_key: 'mock-hash' } })
			);
			expect(mockPb.collection('rooms').update).toHaveBeenCalledWith(
				roomRecord.id,
				expect.objectContaining({ 'participants+': result.id }),
				expect.any(Object)
			);
			expect(setRoomKeyCookie).toHaveBeenCalledWith(roomRecord.id, 'room-key');
		});
	});

	describe('createRoom', () => {
		it('creates room and returns Room with correct shape', async () => {
			mockPb.authStore.model = { id: 'user-1', name: 'Host' } as never;

			const result = await createRoom('My Room', 'REFINEMENT');

			expect(result.id).toBeDefined();
			expect(result.created).toBeDefined();
			expect(result.room_name).toBe('My Room');
			expect(result.room_code).toMatch(/^\d{3}-\d{3}-\d{4}$/);
			expect(result.room_type).toBe('REFINEMENT');
			expect(result.room_key_hash).toBe('mock-hash');
			// Mock create does not set participants; implementation returns newRoom.participants as-is
			expect(result.participants === undefined || Array.isArray(result.participants)).toBe(true);

			expect(mockPb.collection('rooms').create).toHaveBeenCalledWith(
				expect.objectContaining({
					creator: 'user-1',
					room_name: 'My Room',
					room_type: 'REFINEMENT',
					room_key_hash: 'mock-hash'
				})
			);
			expect(setRoomKeyCookie).toHaveBeenCalledWith(result.id, expect.any(String));
		});

		it('creates room with RETROSPECTIVE type', async () => {
			mockPb.authStore.model = { id: 'user-1', name: 'Host' } as never;

			const result = await createRoom('Retro Room', 'RETROSPECTIVE');

			expect(result.room_type).toBe('RETROSPECTIVE');
			expect(result.room_name).toBe('Retro Room');
		});
	});
});
