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
	import { Copy, Eye, EyeClosed } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';

	import PageLoading from '../../components/PageLoading.svelte';
	import ScrumAlert from '../../components/ScrumAlert.svelte';
	import JoinRoomDialog from './components/JoinRoomDialog.svelte';
	import { goto } from '$app/navigation';
	import { getRoomKeyCookie } from '$lib/utils';

	const roomId = $page.params.id;
	// Store the room password inside of hash so it's not sent to the server
	const preSetPwd = $derived.by(() => {
		const hash = $page.url.hash;
		if (!hash || !hash.startsWith('#pwd=')) {
			return undefined;
		}

		const pwd = hash.substring(5);
		return pwd;
	});
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
			? `${room.room_name} [${room.room_code}] - scrumhost.app ${pageSuffix}`
			: `scrumhost.app ${pageSuffix}`
	);
	let loadingError: string = $state('');

	let requirePassword = $state(false);
	let joinPasswordError = $state<string | null>(null);

	async function loadRoom() {
		// Get the room details
		try {
			if (!room && roomId) {
				room = await getRoomDetails(roomId);
				console.log('Initializing room to', room);

				subscribeToRoomUpdates(roomId, (roomUpdate) => {
					console.log('Room update received', roomUpdate);
					room = roomUpdate;
				});
			}
		} catch {
			await goto(`/room-not-found?id=${encodeURIComponent(roomId ?? '')}`);
			return;
		}
	}

	async function joinRoomWithPwd(password: string) {
		if (roomId) userParticipant = await joinRoomAndGetParticipantDetails(roomId, password);
	}

	onMount(async () => {
		await validateLogin();

		// Don't call getRoomDetails here: rooms viewRule only allows read if user is already
		// a participant, so it would 404 for users who just joined by code and need to enter password.
		try {
			if (roomId) userParticipant = await getUserParticipant(roomId);
		} catch (err) {
			console.warn('User not in this room', err);
		}
		if (!userParticipant && preSetPwd) {
			console.log('Try joining room with password from URL hash', preSetPwd);
			await joinRoomWithPwd(preSetPwd);
		}

		if (userParticipant) {
			let currentLink = new URL(window.location.href);
			currentLink.hash = '';
			await goto(currentLink);
		}

		if (!userParticipant && !preSetPwd) {
			requirePassword = true;
		} else {
			await loadRoom();
		}
	});

	async function rejoinWithPwd(password: string) {
		joinPasswordError = null;
		try {
			await joinRoomWithPwd(password);
			if (userParticipant) {
				requirePassword = false;
				await loadRoom();
			}
		} catch {
			joinPasswordError = 'Invalid password. Please try again.';
		}
	}

	function handlePasswordDialogDismiss() {
		joinPasswordError = null;
		goto('/home');
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

	let joinLinkCopied = $state(false);
	function copyJoinLink() {
		if (!room || !roomKey) return;
		const url = new URL(window.location.href);
		url.hash = 'pwd=' + encodeURIComponent(roomKey);
		navigator.clipboard.writeText(url.toString()).then(() => {
			joinLinkCopied = true;
			setTimeout(() => (joinLinkCopied = false), 2000);
		});
	}
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
			<JoinRoomDialog
				handleJoinRoom={(password) => rejoinWithPwd(password)}
				error={joinPasswordError}
				onDismiss={handlePasswordDialogDismiss}
			/>
		{:else}
			<div class="items-center">
				<h1 class="text-4xl font-bold">{room?.room_name}</h1>

				<div class="sm:grid sm:grid-cols-1 md:flex md:flex-auto md:items-center">
					<h2 class="text-xl">Room Code: <span data-testid="room-code">{room?.room_code}</span></h2>
					<span class="ml-4 mr-4 hidden text-2xl md:block">&bull;</span>
					{#if showRoomPassword}
						<div class="flex items-center space-x-2">
							<h2 class="text-xl">
								Password: <span class="blur-none" data-testid="room-password-value">{roomKey}</span>
							</h2>
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
								data-testid="room-password-reveal"
								onclick={() => (showRoomPassword = true)}
								size="icon"
								variant="outline"
								class="opacity-50"
							>
								<Eye />
							</Button>
						</div>
					{/if}
					<span class="ml-4 mr-4 hidden text-2xl md:block">&bull;</span>
					<div class="flex items-center space-x-2">
						<Button
							data-testid="copy-join-link"
							onclick={copyJoinLink}
							disabled={!roomKey}
							size="sm"
							variant="outline"
							title={roomKey
								? 'Copy join link (includes password)'
								: 'Re-enter password to share link'}
						>
							<Copy class="mr-1 h-4 w-4" />
							{joinLinkCopied ? 'Copied!' : 'Copy join link'}
						</Button>
					</div>
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
