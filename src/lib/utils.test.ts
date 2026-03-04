import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cn, formatTimeAgo, getRoomKeyCookie, setRoomKeyCookie } from './utils';

describe('cn', () => {
	it('returns empty string for no inputs', () => {
		expect(cn()).toBe('');
	});

	it('merges single class string', () => {
		expect(cn('foo')).toBe('foo');
	});

	it('merges multiple class strings', () => {
		expect(cn('foo', 'bar')).toBe('foo bar');
	});

	it('filters falsy values', () => {
		expect(cn('foo', null, undefined, false, 'bar')).toBe('foo bar');
	});

	it('merges tailwind classes and resolves conflicts (twMerge)', () => {
		expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
	});

	it('handles conditional classes', () => {
		expect(cn('base', true && 'included', false && 'excluded')).toBe('base included');
	});
});

describe('formatTimeAgo', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});
	afterEach(() => {
		vi.useRealTimers();
	});

	it('returns "just now" for current time', () => {
		const now = new Date(2000, 0, 1, 12, 0, 0);
		vi.setSystemTime(now);
		expect(formatTimeAgo(new Date(now))).toBe('just now');
	});

	it('returns "just now" for less than 1 second ago', () => {
		const now = new Date(2000, 0, 1, 12, 0, 0);
		vi.setSystemTime(now);
		expect(formatTimeAgo(new Date(now.getTime() - 500))).toBe('just now');
	});

	it('returns "1 second ago" for 1 second ago', () => {
		const now = new Date(2000, 0, 1, 12, 0, 0);
		vi.setSystemTime(now);
		expect(formatTimeAgo(new Date(now.getTime() - 1000))).toBe('1 second ago');
	});

	it('returns "X seconds ago" for multiple seconds', () => {
		const now = new Date(2000, 0, 1, 12, 0, 0);
		vi.setSystemTime(now);
		expect(formatTimeAgo(new Date(now.getTime() - 5 * 1000))).toBe('5 seconds ago');
	});

	it('returns "1 minute ago" for 1 minute ago', () => {
		const now = new Date(2000, 0, 1, 12, 0, 0);
		vi.setSystemTime(now);
		expect(formatTimeAgo(new Date(now.getTime() - 60 * 1000))).toBe('1 minute ago');
	});

	it('returns "X minutes ago" for multiple minutes', () => {
		const now = new Date(2000, 0, 1, 12, 0, 0);
		vi.setSystemTime(now);
		expect(formatTimeAgo(new Date(now.getTime() - 3 * 60 * 1000))).toBe('3 minutes ago');
	});

	it('returns "1 hour ago" for 1 hour ago', () => {
		const now = new Date(2000, 0, 1, 12, 0, 0);
		vi.setSystemTime(now);
		expect(formatTimeAgo(new Date(now.getTime() - 3600 * 1000))).toBe('1 hour ago');
	});

	it('returns "2 hours ago" for 2 hours ago', () => {
		const now = new Date(2000, 0, 1, 12, 0, 0);
		vi.setSystemTime(now);
		expect(formatTimeAgo(new Date(now.getTime() - 2 * 3600 * 1000))).toBe('2 hours ago');
	});

	it('returns "1 day ago" for 1 day ago', () => {
		const now = new Date(2000, 0, 1, 12, 0, 0);
		vi.setSystemTime(now);
		expect(formatTimeAgo(new Date(now.getTime() - 86400 * 1000))).toBe('1 day ago');
	});

	it('returns "1 week ago" for 1 week ago', () => {
		const now = new Date(2000, 0, 1, 12, 0, 0);
		vi.setSystemTime(now);
		expect(formatTimeAgo(new Date(now.getTime() - 604800 * 1000))).toBe('1 week ago');
	});

	it('returns "1 month ago" for 1 month in seconds ago', () => {
		const now = new Date(2000, 0, 1, 12, 0, 0);
		vi.setSystemTime(now);
		expect(formatTimeAgo(new Date(now.getTime() - 2592000 * 1000))).toBe('1 month ago');
	});

	it('returns "1 year ago" for 1 year in seconds ago', () => {
		const now = new Date(2000, 0, 1, 12, 0, 0);
		vi.setSystemTime(now);
		expect(formatTimeAgo(new Date(now.getTime() - 31536000 * 1000))).toBe('1 year ago');
	});
});

describe('setRoomKeyCookie and getRoomKeyCookie', () => {
	let cookieStore: string;
	const originalDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');

	beforeEach(() => {
		cookieStore = '';
		// Mock document.cookie so Secure cookies work in test env (happy-dom may drop them otherwise)
		Object.defineProperty(document, 'cookie', {
			get: () => cookieStore,
			set: (v: string) => {
				// Simulate browser: assignment is "name=value; attr; attr". Store only name=value for next read.
				const firstPart = v.split(';')[0]?.trim() ?? '';
				const eq = firstPart.indexOf('=');
				if (eq === -1) return;
				const name = firstPart.slice(0, eq);
				const value = firstPart.slice(eq + 1);
				const rest = cookieStore
					? cookieStore.split('; ').filter((s) => s && !s.startsWith(name + '='))
					: [];
				cookieStore = [...rest, `${name}=${value}`].join('; ');
			},
			configurable: true
		});
	});

	afterEach(() => {
		if (originalDescriptor) {
			Object.defineProperty(document, 'cookie', originalDescriptor);
		}
	});

	it('setRoomKeyCookie sets a cookie with name-RoomKey suffix', () => {
		setRoomKeyCookie('myroom', 'secret-key-123');
		expect(document.cookie).toContain('myroom-RoomKey=secret-key-123');
	});

	it('getRoomKeyCookie returns value set by setRoomKeyCookie', () => {
		setRoomKeyCookie('alpha', 'key-alpha');
		expect(getRoomKeyCookie('alpha')).toBe('key-alpha');
	});

	it('getRoomKeyCookie returns correct value when multiple cookies exist', () => {
		setRoomKeyCookie('room1', 'key1');
		setRoomKeyCookie('room2', 'key2');
		expect(getRoomKeyCookie('room1')).toBe('key1');
		expect(getRoomKeyCookie('room2')).toBe('key2');
	});

	it('getRoomKeyCookie throws when cookie for room is not found', () => {
		cookieStore = '';
		expect(() => getRoomKeyCookie('nonexistent')).toThrow(
			'Could not find cookie for room nonexistent'
		);
	});

	it('getRoomKeyCookie throws when document.cookie is empty', () => {
		cookieStore = '';
		expect(() => getRoomKeyCookie('any')).toThrow('Could not find cookie for room any');
	});

	it('getRoomKeyCookie parses value before first semicolon (cookie attributes)', () => {
		// Simulate cookie string as browser would store it: "name-RoomKey=value; expires=...; path=/..."
		cookieStore = 'other=stuff; myroom-RoomKey=only-this-value; path=/; Secure';
		expect(getRoomKeyCookie('myroom')).toBe('only-this-value');
	});
});
