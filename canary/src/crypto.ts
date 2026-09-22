import { webcrypto } from 'node:crypto';

// Mirrors src/lib/crypto.ts so the canary exercises the exact same
// room-key-hash and story-encryption contract the real client relies on.

export async function hashString(input: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(input);
	const hashBuffer = await webcrypto.subtle.digest('SHA-256', data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function encryptString(passphrase: string, plaintext: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(plaintext);

	const salt = webcrypto.getRandomValues(new Uint8Array(16));
	const baseKey = await webcrypto.subtle.importKey(
		'raw',
		encoder.encode(passphrase),
		{ name: 'PBKDF2' },
		false,
		['deriveKey']
	);
	const derivedKey = await webcrypto.subtle.deriveKey(
		{ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
		baseKey,
		{ name: 'AES-GCM', length: 256 },
		false,
		['encrypt', 'decrypt']
	);

	const iv = webcrypto.getRandomValues(new Uint8Array(12));
	const ciphertext = await webcrypto.subtle.encrypt({ name: 'AES-GCM', iv }, derivedKey, data);

	const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
	combined.set(salt, 0);
	combined.set(iv, salt.length);
	combined.set(new Uint8Array(ciphertext), salt.length + iv.length);

	return Buffer.from(combined).toString('base64');
}

export async function decryptString(passphrase: string, encryptedData: string): Promise<string> {
	const combined = Buffer.from(encryptedData, 'base64');
	const salt = combined.subarray(0, 16);
	const iv = combined.subarray(16, 28);
	const ciphertext = combined.subarray(28);

	const encoder = new TextEncoder();
	const baseKey = await webcrypto.subtle.importKey(
		'raw',
		encoder.encode(passphrase),
		{ name: 'PBKDF2' },
		false,
		['deriveKey']
	);
	const derivedKey = await webcrypto.subtle.deriveKey(
		{ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
		baseKey,
		{ name: 'AES-GCM', length: 256 },
		false,
		['encrypt', 'decrypt']
	);

	const decrypted = await webcrypto.subtle.decrypt({ name: 'AES-GCM', iv }, derivedKey, ciphertext);
	return new TextDecoder().decode(decrypted);
}

export function randomToken(): string {
	return Buffer.from(webcrypto.getRandomValues(new Uint8Array(8))).toString('hex');
}
