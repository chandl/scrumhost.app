<script lang="ts">
    import Button from "$lib/components/ui/button/button.svelte";
    import { login, logout, user } from '$lib/user';
    import { createRoom, getUserRooms, type Room } from '$lib/room';
	import type { AuthModel } from "pocketbase";
	import { onMount } from "svelte";

    let email = '';
    let password = '';
    let currentUser: AuthModel;

    user.subscribe(value => {
        currentUser = value;
    });

    async function handleLogin() {
        await login(email, password);
    }

    function handleLogout() {
        logout();
    }

    function handleCreateRoom() {
        createRoom("Test Room", "0,1,2,3,4,5,6,7,8,9,10")
    }

    let rooms: Room[];
    onMount(async() => {
        rooms = await getUserRooms();
        console.log("Found rooms:", rooms)
    })

</script>

{#if currentUser}
  <p>Welcome, {currentUser.email}!</p>
  <button on:click={handleLogout}>Logout</button>
{:else}
  <form on:submit|preventDefault={handleLogin}>
    <input type="email" bind:value={email} placeholder="Email" required />
    <input type="password" bind:value={password} placeholder="Password" required />
    <button type="submit">Login</button>
  </form>
{/if}

<br/>

<Button on:click={handleCreateRoom}>Create Room</Button>

<br/>

<h1>Rooms</h1>
<ul>
    {#each rooms as room}
    
    <li>
        <a href="/room/{room.id}"> <strong>{room.room_name}</strong> - {room.room_code} - {room.created} - {room.id} </a>
    </li>
    {/each}
</ul>

<br/>