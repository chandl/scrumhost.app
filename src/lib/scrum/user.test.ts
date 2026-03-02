import { describe, it, expect, vi, beforeEach } from 'vitest';
import { writable } from 'svelte/store';
import { mockPb, resetPocketBaseMock } from '../../test/pocketbase-mock';

vi.mock('$lib/pocketbase/pocketbase', async () => {
	const { mockPb } = await import('../../test/pocketbase-mock');
	return { default: mockPb, COLLECTIONS: mockPb.COLLECTIONS };
});

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));

vi.mock('$app/stores', () => ({
	page: writable({ url: new URL('http://localhost/') })
}));

import { goto } from '$app/navigation';
import {
	login,
	logout,
	signup,
	validateLogin,
	generatePassword
} from './user';

describe('user', () => {
	beforeEach(() => {
		resetPocketBaseMock();
		goto.mockClear();
	});

	describe('signup', () => {
		it('creates user with generated username and password and logs in', async () => {
			await signup('Alice');
			const users = mockPb.collection('users');
			expect(users.create).toHaveBeenCalledTimes(1);
			const [createArg] = vi.mocked(users.create).mock.calls[0];
			expect(createArg.name).toBe('Alice');
			expect(createArg.username).toMatch(/^Alice-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
			expect(createArg.password).toBe(createArg.passwordConfirm);
			expect(createArg.password).toHaveLength(16);
			expect(users.authWithPassword).toHaveBeenCalledWith(
				createArg.username,
				createArg.password
			);
		});
	});

	describe('login', () => {
		it('calls authWithPassword with username and password', async () => {
			const users = mockPb.collection('users');
			await login('alice', 'secret');
			expect(users.authWithPassword).toHaveBeenCalledWith('alice', 'secret');
		});
	});

	describe('logout', () => {
		it('clears authStore and unsubscribes from all collections', async () => {
			mockPb.authStore.model = { id: 'u1', username: 'alice' } as never;
			logout();
			expect(mockPb.authStore.model).toBeNull();
			expect(mockPb.collection).toHaveBeenCalled();
			const collectionNames = vi.mocked(mockPb.collection).mock.calls.map(
				(c) => c[0]
			);
			for (const name of mockPb.COLLECTIONS) {
				expect(collectionNames).toContain(name);
			}
		});
	});

	describe('validateLogin', () => {
		it('returns user in props when logged in', async () => {
			mockPb.authStore.model = { id: 'u1', username: 'alice' } as never;
			const users = mockPb.collection('users');
			const result = await validateLogin();
			expect(result?.props?.user).toEqual({ id: 'u1', username: 'alice' });
			expect(goto).not.toHaveBeenCalled();
		});

		it('redirects to join with target when no user', async () => {
			mockPb.authStore.model = null;
			vi.mocked(mockPb.collection('users').authRefresh).mockResolvedValueOnce(
				null as never
			);
			Object.defineProperty(window, 'location', {
				value: { href: 'http://localhost/home' },
				writable: true
			});
			await validateLogin();
			expect(goto).toHaveBeenCalledWith(
				'/join?target=' + encodeURIComponent('http://localhost/home')
			);
		});
	});

	describe('generatePassword', () => {
		it('returns string with requested length', () => {
			expect(generatePassword(16)).toHaveLength(16);
			expect(generatePassword(0)).toHaveLength(0);
			expect(generatePassword(32)).toHaveLength(32);
		});
	});

	describe('generateUsername (via signup)', () => {
		it('uses sanitized name and UUID format', async () => {
			await signup('Bob-Smith');
			const users = mockPb.collection('users');
			const [createArg] = vi.mocked(users.create).mock.calls[0];
			// name with non-alpha removed: BobSmith
			expect(createArg.username).toMatch(/^BobSmith-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
		});
	});
});
