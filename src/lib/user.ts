import { writable } from 'svelte/store';
import pb from './pocketbase';

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
