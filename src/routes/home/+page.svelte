<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import { user, validateLogin } from '$lib/scrum/user';
	import { getUserRooms, joinRoomWithCode } from '$lib/scrum/room';
	import type { AuthModel } from 'pocketbase';
	import { onMount } from 'svelte';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { goto } from '$app/navigation';
	import { CircleAlert, Clock2, Users } from 'lucide-svelte';
	import { formatTimeAgo } from '$lib/utils';
	import type { ParticipantRoomDetails } from '$lib/scrum/types/room';
	import RoomCreator from '../components/RoomCreator.svelte';
	import RoomTypePill from '../components/RoomTypePill.svelte';

	let currentUser = $state<AuthModel | null>(null);
	user.subscribe((value) => {
		currentUser = value;
	});

	let rooms = $state<ParticipantRoomDetails[]>([]);
	onMount(async () => {
		await validateLogin();
		try {
			rooms = await getUserRooms();
			console.log('Found rooms:', rooms);
		} catch (err) {
			console.error('Failed to load recent rooms', err);
		}
	});

	let joinRoomCode = $state('');
	let joinError = $state<string | null>(null);
	async function handleJoinRoom() {
		joinError = null;
		try {
			await joinRoomWithCode(joinRoomCode.trim());
		} catch (err) {
			joinError = err instanceof Error ? err.message : 'Failed to join room. Try again.';
		}
	}
</script>

<svelte:head>
	<title>Home · scrumhost</title>
</svelte:head>

<main class="mx-auto flex w-full max-w-md flex-grow flex-col gap-6 px-4 py-10 sm:py-16">
	<Card class="animate-rise-in">
		<CardHeader>
			<CardTitle tag="h1" class="text-2xl">Welcome, {currentUser?.name}</CardTitle>
			<CardDescription>
				Start a new room, or join one with the code your facilitator shared.
			</CardDescription>
		</CardHeader>
		<CardContent class="space-y-5">
			<RoomCreator />

			<div class="flex items-center gap-3 text-xs font-medium uppercase text-muted-foreground">
				<span class="h-px flex-1 bg-border"></span>
				or
				<span class="h-px flex-1 bg-border"></span>
			</div>

			<form
				class="space-y-2"
				onsubmit={(e) => {
					e.preventDefault();
					if (joinRoomCode.trim()) handleJoinRoom();
				}}
			>
				<Label for="room-code-input">Room code</Label>
				<div class="flex flex-col gap-2 sm:flex-row">
					<Input
						id="room-code-input"
						type="text"
						autocomplete="off"
						placeholder="123-456-7890"
						bind:value={joinRoomCode}
						oninput={() => (joinError = null)}
						aria-invalid={joinError ? 'true' : undefined}
						aria-describedby={joinError ? 'join-room-code-error' : undefined}
						class="h-12 font-mono text-base tracking-wide"
						data-testid="room-code-input"
					/>
					<Button type="submit" size="lg" variant="outline" disabled={!joinRoomCode.trim()}>
						Join Room
					</Button>
				</div>
				{#if joinError}
					<div
						id="join-room-code-error"
						role="alert"
						class="flex animate-rise-in gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm"
					>
						<CircleAlert class="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
						<div>
							<p class="font-medium text-foreground">Could not join room</p>
							<p class="text-foreground-secondary">{joinError}</p>
						</div>
					</div>
				{/if}
			</form>
		</CardContent>
	</Card>

	{#if rooms?.length > 0}
		<section class="animate-rise-in">
			<h2 class="mb-3 px-1 text-sm font-semibold text-foreground-secondary">
				Recently Joined Rooms
			</h2>
			<ul class="divide-y overflow-hidden rounded-xl border bg-card shadow-soft">
				{#each rooms as room}
					<li class="flex items-center gap-3 p-4">
						<div class="min-w-0 flex-1">
							<div class="flex min-w-0 items-center gap-2">
								<h3 class="truncate font-medium">{room.room_name}</h3>
								<RoomTypePill type={room.room_type} short />
							</div>
							<div
								class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground"
							>
								<span class="font-mono text-xs">{room.room_code}</span>
								<span class="inline-flex items-center gap-1">
									<Users class="h-3.5 w-3.5" aria-hidden="true" />
									{room.participants?.length ?? 0}
									<span class="sr-only">participants</span>
								</span>
								<span class="inline-flex items-center gap-1">
									<Clock2 class="h-3.5 w-3.5" aria-hidden="true" />
									{formatTimeAgo(new Date(room.time_joined))}
								</span>
							</div>
						</div>
						<Button variant="outline" size="sm" on:click={() => goto(`/room/${room.id}`)}>
							Rejoin
						</Button>
					</li>
				{/each}
			</ul>
		</section>
	{/if}
</main>
