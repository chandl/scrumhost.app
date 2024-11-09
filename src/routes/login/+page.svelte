<script lang="ts">
	import { goto } from '$app/navigation';
	import { login, logout, user } from '$lib/user';
	import type { AuthModel } from 'pocketbase';

	let email = '';
	let password = '';

	let currentUser: AuthModel;
	user.subscribe((value) => {
		currentUser = value;
	});

	async function handleLogin() {
		await login(email, password);
		goto('/');
	}
</script>

{#if currentUser}
	<strong><a href="/">Home</a></strong>

	<p>Welcome, {currentUser.email}!</p>
	<button on:click={logout}>Logout</button>
{:else}
	<form on:submit|preventDefault={handleLogin}>
		<input type="email" bind:value={email} placeholder="Email" required />
		<input type="password" bind:value={password} placeholder="Password" required />
		<button type="submit">Login</button>
	</form>
{/if}
