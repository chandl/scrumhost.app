<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import { user, validateLogin } from '$lib/user';
	import {
		getUserRooms,
		joinRoomWithCode,
		type ParticipantRoomDetails,
		type Room,
		type RoomDetails
	} from '$lib/room';
	import type { AuthModel } from 'pocketbase';
	import { onMount } from 'svelte';
	import {
		Card,
		CardContent,
		CardDescription,
		CardFooter,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { goto } from '$app/navigation';
	import RoomCreator from './components/RoomCreator.svelte';

	let currentUser: AuthModel;
	user.subscribe((value) => {
		currentUser = value;
	});

	let rooms: ParticipantRoomDetails[];
	onMount(async () => {
		validateLogin();
		rooms = await getUserRooms();
		console.log('Found rooms:', rooms);
	});

	let joinRoomCode: string;
	function handleJoinRoom() {
		console.log('handleJoinRoom', joinRoomCode);
		joinRoomWithCode(joinRoomCode);
	}

	function truncate(str: string, n: number) {
		return str.length > n ? str.slice(0, n - 1) + '…' : str;
	}

	function formatTimeAgo(date: Date): string {
		const now = new Date();
		const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

		const intervals: { [key: string]: number } = {
			year: 31536000,
			month: 2592000,
			week: 604800,
			day: 86400,
			hour: 3600,
			minute: 60,
			second: 1
		};

		for (const [unit, secondsInUnit] of Object.entries(intervals)) {
			const interval = Math.floor(seconds / secondsInUnit);
			if (interval >= 1) {
				return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
			}
		}
		return 'just now';
	}
</script>

<div
	class="flex min-h-screen flex-col items-center justify-center space-y-8 bg-gradient-to-b from-blue-100 to-white p-4"
>
	<Card class="w-full max-w-md">
		<CardHeader>
			<CardTitle class="text-center text-2xl font-bold">Welcome, {currentUser?.name}</CardTitle>
			<CardDescription class="text-center"
				>Create or join a room to get started refining your backlog</CardDescription
			>
		</CardHeader>
		<CardContent class="space-y-4">
			<RoomCreator />
			<div class="relative">
				<div class="absolute inset-0 flex items-center">
					<span class="w-full border-t"></span>
				</div>
				<div class="relative flex justify-center text-xs uppercase">
					<span class="bg-background px-2 text-muted-foreground">Or</span>
				</div>
			</div>
			<Input
				type="text"
				placeholder="Enter Room Code"
				bind:value={joinRoomCode}
				class="py-6 text-lg"
			/>
		</CardContent>
		<CardFooter>
			<Button class="w-full py-6 text-lg" disabled={!joinRoomCode} on:click={handleJoinRoom}>
				Join Room
			</Button>
		</CardFooter>
	</Card>

	<!-- Recently Joined Rooms  -->
	<Card class="w-full max-w-md">
		<CardHeader>
			<CardTitle class="text-xl font-bold">Recently Joined Rooms</CardTitle>
		</CardHeader>
		<CardContent>
			<ul class="space-y-4">
				{#each rooms as room}
					<li
						class="flex items-center justify-between rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100"
					>
						<div>
							<h3 class="font-semibold">{truncate(room.room_name, 25)} [{room.room_code}]</h3>
							<div class="flex items-center space-x-4 text-sm text-gray-500">
								<span class="flex items-center">
									<!-- TODO user icon -->
									<h1 class="mr-1 h-4 w-4">X</h1>
									{room.participants.length} participant(s)
								</span>
								<span class="flex items-center">
									<!-- TODO clock icon -->
									<h1 class="mr-1 h-4 w-4">Y</h1>
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
		</CardContent>
	</Card>
</div>
