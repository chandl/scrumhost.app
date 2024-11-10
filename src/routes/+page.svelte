<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import { logout, user, validateLogin } from '$lib/user';
	import { createRoom, getUserRooms, joinRoomWithCode, type Room } from '$lib/room';
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

	let currentUser: AuthModel;
	user.subscribe((value) => {
		currentUser = value;
	});

	async function handleCreateRoom() {
		const roomId = await createRoom('Test Room', '0,1,2,3,4,5,6,7,8,9,10');

		goto(`/room/${roomId}`);
	}

	let rooms: Room[];
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
</script>

<div
	class="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-100 to-white p-4"
>
	<Card class="w-full max-w-md">
		<CardHeader>
			<CardTitle class="text-center text-2xl font-bold">scrum.host</CardTitle>
			<CardDescription class="text-center"
				>Create or join a room to get started refining your backlog</CardDescription
			>
		</CardHeader>
		<CardContent class="space-y-4">
			<Button class="w-full py-6 text-lg" on:click={handleCreateRoom}>Create Room</Button>
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
							<h3 class="font-semibold">{room.room_name}</h3>
							<div class="flex items-center space-x-4 text-sm text-gray-500">
								<span class="flex items-center">
									<!-- TODO user icon -->
									<h1 class="mr-1 h-4 w-4">X</h1>
									0(TBD) participants
								</span>
								<span class="flex items-center">
									<!-- TODO clock icon -->
									<h1 class="mr-1 h-4 w-4">Y</h1>
									Last Joined Date
								</span>
							</div>
						</div>
						<Button variant="outline" size="sm" on:click={() => goto(`/room/${room.id}`)}>
							Rejoin
						</Button>
						<!-- <a href="/room/{room.id}">
					<strong>{room.room_name}</strong> - {room.room_code} - {room.created} - {room.id}
				</a> -->
					</li>
				{/each}

				<!-- {recentRooms.map(room => (
			<li key={room.id} >
			<div>
				<h3 class="font-semibold">{room.name}</h3>
				<div class="flex items-center text-sm text-gray-500 space-x-4">
				<span class="flex items-center">
					<Users class="w-4 h-4 mr-1" />
					{room.participants} participants
				</span>
				<span class="flex items-center">
					<Clock class="w-4 h-4 mr-1" />
					{room.lastJoined}
				</span>
				</div>
			</div>
			<Button variant="outline" size="sm" onClick={() => console.log(`Rejoining room: ${room.name}`)}>
				Rejoin
			</Button>
			</li>
		))} -->
			</ul>
		</CardContent>
	</Card>
</div>
