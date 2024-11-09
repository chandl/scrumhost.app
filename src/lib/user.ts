import { writable } from 'svelte/store';
import pb from './pocketbase';
import { goto } from '$app/navigation';

export const user = writable(pb.authStore.model);

// Listen to auth changes and keep the user store updated
pb.authStore.onChange(() => {
	user.set(pb.authStore.model);
});

export async function login(email: string, password: string) {
	try {
		await pb.collection('users').authWithPassword(email, password);
		console.log('Logged in successfully');
	} catch (err) {
		console.error('Login error:', err);
	}
}

export function logout() {
	pb.authStore.clear();
	console.log('Logged out');
}

export async function signup(email: string, password: string, passwordConfirm: string) {
	try {
		await pb.collection('users').create({
			email,
			password,
			passwordConfirm
		});
		console.log('Sign-up successful');
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
