<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import { logout, user, validateLogin } from '$lib/user';
	import { createRoom, getUserRooms, joinRoomWithCode, type Room } from '$lib/room';
	import type { AuthModel } from 'pocketbase';
	import { onMount } from 'svelte';

	let currentUser: AuthModel;
	user.subscribe((value) => {
		currentUser = value;
	});

	function handleCreateRoom() {
		createRoom('Test Room', '0,1,2,3,4,5,6,7,8,9,10');
	}

	let rooms: Room[];
	onMount(async () => {
		validateLogin();
		rooms = await getUserRooms();
		console.log('Found rooms:', rooms);
	});

	let joinRoomCode: string;
	function handleJoinRoom() {
		joinRoomWithCode(joinRoomCode);
	}
</script>

{#if currentUser}
	<p>Welcome, {currentUser.email}!</p>
	<button on:click={logout}>Logout</button>
{/if}

<br />

<Button on:click={handleCreateRoom}>Create Room</Button>

<br />

<h1>Rooms</h1>
<ul>
	{#each rooms as room}
		<li>
			<a href="/room/{room.id}">
				<strong>{room.room_name}</strong> - {room.room_code} - {room.created} - {room.id}
			</a>
		</li>
	{/each}
</ul>

<br />

<form on:submit|preventDefault={handleJoinRoom}>
	<input type="text" bind:value={joinRoomCode} placeholder="Room Code" required />
	<button type="submit">Join Room with Code</button>
</form>
