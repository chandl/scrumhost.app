<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardFooter,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { signup, user } from '$lib/scrum/user';
	import { UserPen } from 'lucide-svelte';
	import type { AuthModel } from 'pocketbase';
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { page } from '$app/stores';

	let currentUser: AuthModel;
	user.subscribe((value) => {
		currentUser = value;
	});

	let targetPath: string = '/';

	function handleRedirect() {
		console.log('Redirect to target path', targetPath);
		goto(targetPath);
	}

	let name = '';
	async function handleSubmit() {
		console.log('Submit name to register', name);
		await signup(name);
		handleRedirect();
	}

	onMount(() => {
		if (currentUser) {
			console.log('Already logged in');
			handleRedirect();
		}

		const params = new URLSearchParams(get(page).url.search);
		targetPath = params.get('target') || '/';
	});
</script>

<svelte:head>
	<title>scrum.host - join</title>
</svelte:head>

<div
	class="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-100 to-white p-4"
>
	<Card class="w-full max-w-md">
		<CardHeader>
			<CardTitle class="text-center text-2xl font-bold">scrum.host</CardTitle>
			<CardDescription class="text-center">Please enter your name to continue</CardDescription>
		</CardHeader>
		<form on:submit={handleSubmit}>
			<CardContent class="space-y-4">
				<div class="space-y-2">
					<Label for="name">Your Name</Label>
					<div class="relative">
						<UserPen class="absolute left-3 top-1/2 -translate-y-1/2 transform text-gray-500" />
						<Input
							id="name"
							type="text"
							placeholder="Enter your name"
							bind:value={name}
							class="py-6 pl-10 text-lg"
							required
						/>
					</div>
				</div>
			</CardContent>
			<CardFooter>
				<Button type="submit" class="w-full py-6 text-lg" disabled={!name.trim()}>Continue</Button>
			</CardFooter>
		</form>
	</Card>
</div>
