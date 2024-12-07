<script lang="ts">
	import { page } from '$app/stores';

	import {
		getRoomDetails,
		getUserParticipant,
		joinRoomAndGetParticipantDetails,
		subscribeToRoomUpdates
	} from '$lib/scrum/room';
	import { onMount } from 'svelte';
	import { validateLogin } from '$lib/scrum/user';
	import BacklogRefinementRoom from './components/refinement/BacklogRefinementRoom.svelte';
	import type { Participant, RoomDetails, RoomType } from '$lib/scrum/types/room';
	import RetrospectiveRoom from './components/retrospective/RetrospectiveRoom.svelte';
	import { Eye, EyeClosed } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';

	import PageLoading from '../../components/PageLoading.svelte';
	import ScrumAlert from '../../components/ScrumAlert.svelte';
	import JoinRoomDialog from './components/JoinRoomDialog.svelte';
	import { goto } from '$app/navigation';
	import { getRoomKeyCookie } from '$lib/utils';

	const roomId = $page.params.id;
	const preSetPwd = $page.url.searchParams.get('pwd');
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

	let pageTitle = $derived(
		room
			? `${room.room_name} [${room.room_code}] - scrum.host ${pageSuffix}`
			: `scrum.host ${pageSuffix}`
	);
	let loadingError: string = $state('');

	let requirePassword = $state(false);

	async function loadRoom() {
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
		} catch (err) {
			// TODO go to 404 page
			loadingError = `${err}`;
		}
	}

	async function joinRoomWithPwd(password: string) {
		userParticipant = await joinRoomAndGetParticipantDetails(roomId, password);
	}

	onMount(async () => {
		validateLogin();

		try {
			userParticipant = await getUserParticipant(roomId);
		} catch (err) {
			console.warn('User not in this room', err);
		}
		if (!userParticipant && preSetPwd) {
			console.log('Try joining room with password from URL param', preSetPwd);
			// Attempt to join the room. Will fail if already in it, but that's fine
			await joinRoomWithPwd(preSetPwd);
		}

		if (userParticipant) {
			let currentLink = new URL(window.location.href);
			currentLink.searchParams.delete('pwd');
			await goto(currentLink);
		}

		if (!userParticipant && !preSetPwd) {
			requirePassword = true;
		} else {
			await loadRoom();
		}
	});

	async function rejoinWithPwd(password: string) {
		await joinRoomWithPwd(password);
		if (userParticipant) {
			requirePassword = false;
			await loadRoom();
		}
	}

	let showRoomPassword = $state(false);

	let roomKey = $derived.by(() => {
		if (room) {
			try {
				return getRoomKeyCookie(room.id);
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
			} catch (_) {
				return undefined;
			}
		}
	});
</script>

<svelte:head>
	<title>{pageTitle}</title>
</svelte:head>

<div class="mt-12 h-[calc(100vh-50px)] p-8">
	<div class="mx-auto max-w-6xl space-y-4">
		{#if !room && loadingError === '' && !requirePassword}
			<PageLoading />
		{:else if loadingError !== ''}
			<ScrumAlert title="Error Loading Room" body={loadingError} duration={-1} onClose={() => {}} />
		{:else if requirePassword}
			<JoinRoomDialog handleJoinRoom={(password) => rejoinWithPwd(password)} />
		{:else}
			<div class="items-center">
				<h1 class="text-4xl font-bold">{room?.room_name}</h1>

				<div class="sm:grid sm:grid-cols-1 md:flex md:flex-auto md:items-center">
					<h2 class="text-xl">Room Code: {room?.room_code}</h2>
					<span class="ml-4 mr-4 hidden text-2xl md:block">&bull;</span>
					{#if showRoomPassword}
						<div class="flex items-center space-x-2">
							<h2 class="text-xl">Password: <span class="blur-none">{roomKey}</span></h2>
							<Button
								onclick={() => (showRoomPassword = false)}
								size="icon"
								variant="outline"
								class="opacity-50"
							>
								<EyeClosed />
							</Button>
						</div>
					{:else}
						<div class="flex items-center space-x-2">
							<h2 class="text-xl">Password: <span class="blur-sm">{roomKey}</span></h2>
							<Button
								onclick={() => (showRoomPassword = true)}
								size="icon"
								variant="outline"
								class="opacity-50"
							>
								<Eye />
							</Button>
						</div>
					{/if}
				</div>
			</div>
			{#if roomType === 'REFINEMENT'}
				<BacklogRefinementRoom
					parentRoom={room}
					{participants}
					{userParticipant}
					roomPassword={roomKey || ''}
				/>
			{:else if roomType === 'RETROSPECTIVE'}
				<RetrospectiveRoom {participants} {userParticipant} roomPassword={roomKey || ''} />
			{/if}
		{/if}
	</div>
</div>
