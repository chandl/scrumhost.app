import { describe, it, expect } from 'vitest';
import { hashString, encryptString, decryptString } from './crypto';

describe('hashString', () => {
	it('is deterministic: same input produces same output', async () => {
		const input = 'hello world';
		const a = await hashString(input);
		const b = await hashString(input);
		expect(a).toBe(b);
	});

	it('produces hex string of expected length for SHA-256', async () => {
		const out = await hashString('test');
		expect(out).toMatch(/^[a-f0-9]+$/);
		expect(out).toHaveLength(64); // 256 bits = 32 bytes = 64 hex chars
	});
});

describe('encryptString / decryptString', () => {
	const testKey = 'test-passphrase';

	it('round-trip: encrypt then decrypt returns original plaintext', async () => {
		const plaintext = 'secret message';
		const encrypted = await encryptString(testKey, plaintext);
		const decrypted = await decryptString(testKey, encrypted);
		expect(decrypted).toBe(plaintext);
	});

	it('round-trip with empty string', async () => {
		const plaintext = '';
		const encrypted = await encryptString(testKey, plaintext);
		const decrypted = await decryptString(testKey, encrypted);
		expect(decrypted).toBe(plaintext);
	});

	it('round-trip with unicode and special characters', async () => {
		const plaintext = 'café 🎉 <script>';
		const encrypted = await encryptString(testKey, plaintext);
		const decrypted = await decryptString(testKey, encrypted);
		expect(decrypted).toBe(plaintext);
	});
});
