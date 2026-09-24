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
	import { ArrowRight, UserRound } from 'lucide-svelte';
	import type { AuthModel } from 'pocketbase';
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { page } from '$app/stores';

	let currentUser: AuthModel;
	user.subscribe((value) => {
		currentUser = value;
	});

	let targetPath: string = '/home';

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
		targetPath = params.get('target') || '/home';
	});
</script>

<svelte:head>
	<title>Enter your name · scrumhost</title>
</svelte:head>

<main class="flex flex-grow flex-col items-center justify-center px-4 py-10">
	<Card class="w-full max-w-md animate-rise-in">
		<CardHeader>
			<CardTitle tag="h1" class="text-2xl">What should we call you?</CardTitle>
			<CardDescription>
				Your name is shown to your teammates in the room. No account needed.
			</CardDescription>
		</CardHeader>
		<form on:submit|preventDefault={handleSubmit}>
			<CardContent class="space-y-2">
				<Label for="name">Your Name</Label>
				<div class="relative">
					<UserRound
						class="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
						aria-hidden="true"
					/>
					<Input
						id="name"
						type="text"
						placeholder="e.g. Alex Kim"
						autocomplete="nickname"
						bind:value={name}
						class="h-12 pl-10 text-base"
						required
					/>
				</div>
			</CardContent>
			<CardFooter>
				<Button type="submit" size="lg" class="w-full" disabled={!name.trim()}>
					Continue
					<ArrowRight aria-hidden="true" />
				</Button>
			</CardFooter>
		</form>
	</Card>
</main>
