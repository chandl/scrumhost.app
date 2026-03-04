import { get, writable } from 'svelte/store';
import pb, { COLLECTIONS } from '../pocketbase/pocketbase';
import { goto } from '$app/navigation';
import { page } from '$app/stores';

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

export async function validateLogin() {
	// Check if the user is logged in by trying to get the current user
	try {
		// If we already have a session (e.g. just signed up), skip refresh to avoid redirect
		// when refresh fails or isValid is not yet true (e.g. E2E, slow storage).
		if (pb.authStore.model) {
			return { props: { user: pb.authStore.model } };
		}

		try {
			await pb.collection('users').authRefresh();
		} catch (err) {
			console.error('Failed to refresh auth token', err);
			pb.authStore.clear();
		}

		let user = pb.authStore.model;

		// On full page load, auth may not be in memory yet; give storage a moment then recheck.
		if (!user && typeof window !== 'undefined') {
			await new Promise((r) => setTimeout(r, 300));
			user = pb.authStore.model;
		}

		// If user is not logged in, redirect to the login page
		if (!user) {
			console.log('Current page url', get(page).url);
			const loginUrl = `/join?target=${encodeURIComponent(window.location.href)}`;

			console.log('Redirect', loginUrl);
			goto(loginUrl); // Redirect to login page
			return;
		}

		return { props: { user } };
	} catch (error) {
		console.error('Error checking authentication:', error);
		goto('/join'); // Redirect to login page if there’s an error
		return;
	}
}

export function generatePassword(length: number): string {
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
	return `${name.replace(/[^a-zA-Z]/g, '')}-${crypto.randomUUID()}`;
}
