<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardDescription,
		CardFooter,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Home, SearchX } from 'lucide-svelte';

	const invalidId = $derived($page.url.searchParams.get('id'));
</script>

<svelte:head>
	<title>Room not found - scrumhost.app</title>
</svelte:head>

<div
	class="flex min-h-screen grow flex-col items-center justify-center p-4"
	data-testid="room-not-found-page"
>
	<Card class="w-full max-w-md">
		<CardHeader>
			<CardTitle class="flex items-center gap-2 text-xl">
				<SearchX class="h-6 w-6" />
				Room not found
			</CardTitle>
			<CardDescription>
				{#if invalidId}
					The room you're looking for doesn't exist or you don't have access. Check the room code
					and try again from home.
				{:else}
					The room you're looking for doesn't exist or you don't have access. Join with a room code
					from home or create a new room.
				{/if}
			</CardDescription>
		</CardHeader>
		<CardFooter>
			<Button class="w-full" onclick={() => goto('/home')}>
				<Home class="mr-2 h-4 w-4" />
				Go to Home
			</Button>
		</CardFooter>
	</Card>
</div>
