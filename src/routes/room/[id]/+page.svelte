<script lang="ts">
	import { page } from '$app/stores';

	import {
		getRoomDetails,
		joinRoomAndGetParticipantDetails,
		subscribeToRoomUpdates
	} from '$lib/scrum/room';
	import { onMount } from 'svelte';
	import { validateLogin } from '$lib/scrum/user';
	import BacklogRefinementRoom from './components/BacklogRefinementRoom.svelte';
	import type { Participant, RoomDetails, RoomType } from '$lib/scrum/types/room';
	import RetrospectiveRoom from './components/retrospective/RetrospectiveRoom.svelte';

	const roomId = $page.params.id;
	let room: RoomDetails | undefined = $state();
	let participants: Participant[] = $derived.by(() => room?.participants || []);
	let userParticipant: Participant | undefined = $state();

	let roomType: RoomType | undefined = $derived(room?.room_type);

	let pageSuffix = $derived.by(() => {
		switch (roomType) {
			case 'REFINEMENT':
				return 'backlog refinement';
			case 'RETROSPECTIVE':
				return 'team retrospective';
			default:
				return '';
		}
	});

	let pageTitle = $derived(`${room?.room_name} [${room?.room_code}] - scrum.host ${pageSuffix}`);

	onMount(async () => {
		validateLogin();

		// Get the room details
		try {
			if (!room) {
				room = await getRoomDetails(roomId);
				console.log('Initializing room to', room);

				subscribeToRoomUpdates(roomId, (roomUpdate) => {
					console.log('Room update received', roomUpdate);
					room = roomUpdate;
				});
			}
			// Attempt to join the room. Will fail if already in it, but that's fine
			userParticipant = await joinRoomAndGetParticipantDetails(roomId);
		} catch (err) {
			console.error('Could not find room with id', roomId, err);
			// TODO go to 404 page
			return;
		}
	});
</script>

<svelte:head>
	<title>{pageTitle}</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-b from-blue-100 to-white p-8">
	<div class="mx-auto max-w-6xl space-y-8">
		<h1 class="text-4xl font-bold">{room?.room_name} [{room?.room_code}]</h1>

		{#if roomType === 'REFINEMENT'}
			<BacklogRefinementRoom parentRoom={room} {participants} {userParticipant} />
		{:else if roomType === 'RETROSPECTIVE'}
			<RetrospectiveRoom parentRoom={room} {participants} {userParticipant} />
		{/if}
	</div>
</div>
