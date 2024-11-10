import { writable } from 'svelte/store';
import pb, { COLLECTIONS } from './pocketbase';
import { goto } from '$app/navigation';

export const user = writable(pb.authStore.model);

// Listen to auth changes and keep the user store updated
pb.authStore.onChange(() => {
	user.set(pb.authStore.model);
});

export async function login(username: string, password: string) {
	try {
		await pb.collection('users').authWithPassword(username, password);
		console.log('Logged in successfully');
	} catch (err) {
		console.error('Login error:', err);
	}
}

export function logout() {
	// clear all subscriptions
	COLLECTIONS.forEach(async (coll) => {
		try {
			console.log('Trying to unsubscribe from collection', coll);
			await pb.collection(coll).unsubscribe();
		} catch (err) {
			console.warn('Failed to unsubscribe to', coll, err);
		}
	});

	pb.authStore.clear();
	console.log('Logged out');
}

export async function signup(name: string) {
	const userName = generateUsername(name);
	const passwd = generatePassword(16);
	try {
		const user = await pb.collection('users').create({
			username: userName,
			name,
			password: passwd,
			passwordConfirm: passwd
		});

		console.log('Sign-up successful. Logging in', user);
		await login(userName, passwd);
	} catch (err) {
		console.error('Sign-up error:', err);
	}
}

export function validateLogin() {
	// Check if the user is logged in by trying to get the current user
	try {
		const user = pb.authStore.model;

		// If user is not logged in, redirect to the login page
		if (!user) {
			goto('/login'); // Redirect to login page
		}

		return {
			props: {
				user
			}
		};
	} catch (error) {
		console.error('Error checking authentication:', error);
		goto('/login'); // Redirect to login page if there’s an error
	}
}

function generatePassword(length: number): string {
	const chars =
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=';
	let password = '';

	for (let i = 0; i < length; i++) {
		const randomIndex = Math.floor(Math.random() * chars.length);
		password += chars[randomIndex];
	}

	return password;
}

function generateUsername(name: string): string {
	const randomNumber = Math.floor(Math.random() * 10000); // Random number between 0 and 9999
	return `${name.replace(/[^a-zA-Z]/g, '')}${randomNumber}`;
}
