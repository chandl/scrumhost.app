<script lang="ts">
	import { page } from '$app/stores';
	import { buttonVariants } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { SearchX } from 'lucide-svelte';

	const invalidId = $derived($page.url.searchParams.get('id'));
</script>

<svelte:head>
	<title>Room not found · scrumhost</title>
</svelte:head>

<main
	class="flex flex-grow flex-col items-center justify-center px-4 py-10"
	data-testid="room-not-found-page"
>
	<Card class="w-full max-w-md animate-rise-in">
		<CardContent class="flex flex-col items-center p-8 text-center sm:p-10">
			<div
				class="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground"
			>
				<SearchX class="h-6 w-6" aria-hidden="true" />
			</div>
			<h1 class="text-2xl">Room not found</h1>
			<p class="mt-2 text-foreground-secondary">
				{#if invalidId}
					This room doesn't exist, or you don't have access to it. Double-check the room code and
					try again.
				{:else}
					This room doesn't exist, or you don't have access to it. Join with a room code or create a
					new room.
				{/if}
			</p>
			<a href="/home" class="{buttonVariants()} mt-6 w-full sm:w-auto">Back to home</a>
		</CardContent>
	</Card>
</main>
