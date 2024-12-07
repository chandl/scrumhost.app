export async function hashString(input: string) {
	const encoder = new TextEncoder();
	const data = encoder.encode(input);

	const hashBuffer = await crypto.subtle.digest('SHA-256', data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Function to convert ArrayBuffer to Base64 string
function arrayBufferToBase64(buffer: ArrayBuffer): string {
	return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

// Function to convert Base64 string to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
	const binaryString = atob(base64);
	const length = binaryString.length;
	const arrayBuffer = new ArrayBuffer(length);
	const view = new Uint8Array(arrayBuffer);

	for (let i = 0; i < length; i++) {
		view[i] = binaryString.charCodeAt(i);
	}
	return arrayBuffer;
}
// Encrypt data using AES-GCM
export async function encryptString(passphrase: string, plaintext: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(plaintext);

	// Generate a cryptographic key from the passphrase using PBKDF2
	const salt = crypto.getRandomValues(new Uint8Array(16)); // Generate random salt
	const key = await crypto.subtle.importKey(
		'raw',
		encoder.encode(passphrase),
		{ name: 'PBKDF2' },
		false,
		['deriveKey']
	);

	const derivedKey = await crypto.subtle.deriveKey(
		{ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
		key,
		{ name: 'AES-GCM', length: 256 },
		false,
		['encrypt', 'decrypt']
	);

	// Generate a random IV (initialization vector)
	const iv = crypto.getRandomValues(new Uint8Array(12)); // AES-GCM requires 12-byte IV

	// Encrypt the data
	const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, derivedKey, data);

	// Combine the salt, IV, and ciphertext, then encode it in Base64 for storage/transmission
	const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
	combined.set(salt, 0);
	combined.set(iv, salt.length);
	combined.set(new Uint8Array(ciphertext), salt.length + iv.length);

	return arrayBufferToBase64(combined);
}

// Maintain an in-memory decryption cache. Every time there is an update to the page,
// all tasks/items are re-decrypted. Cache to avoid the overhead.
const DECRYPT_CACHE = new Map();

// Decrypt data using AES-GCM
export async function decryptString(passphrase: string, encryptedData: string): Promise<string> {
	const cacheKey = passphrase + encryptedData;
	if (DECRYPT_CACHE.has(cacheKey)) {
		return Promise.resolve(DECRYPT_CACHE.get(cacheKey));
	}

	const decoder = new TextDecoder();

	// Decode the combined salt, IV, and ciphertext from Base64
	const combined = base64ToArrayBuffer(encryptedData);

	// Extract the salt (first 16 bytes), IV (next 12 bytes), and ciphertext (remaining data)
	const salt = combined.slice(0, 16);
	const iv = combined.slice(16, 28); // 12-byte IV
	const ciphertext = combined.slice(28);

	// Generate the same key from the passphrase using PBKDF2
	const encoder = new TextEncoder();
	const key = await crypto.subtle.importKey(
		'raw',
		encoder.encode(passphrase),
		{ name: 'PBKDF2' },
		false,
		['deriveKey']
	);

	const derivedKey = await crypto.subtle.deriveKey(
		{ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
		key,
		{ name: 'AES-GCM', length: 256 },
		false,
		['encrypt', 'decrypt']
	);

	// Decrypt the data
	const decryptedData = await crypto.subtle.decrypt(
		{ name: 'AES-GCM', iv },
		derivedKey,
		ciphertext
	);

	const decoded = decoder.decode(decryptedData);

	DECRYPT_CACHE.set(cacheKey, decoded);

	return decoded;
}
