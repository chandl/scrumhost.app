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
	import { Check, Copy, Eye, EyeOff, Link } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import RoomTypePill from '../../components/RoomTypePill.svelte';
	import ParticipantAvatars from './components/ParticipantAvatars.svelte';

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
		room ? `${room.room_name} · scrumhost ${pageSuffix}` : `scrumhost ${pageSuffix}`
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

	// Short-lived "copied" feedback for the share strip's copy buttons
	let copiedField = $state<'code' | 'password' | null>(null);
	function copyText(field: 'code' | 'password', text: string | undefined) {
		if (!text) return;
		navigator.clipboard.writeText(text).then(() => {
			copiedField = field;
			setTimeout(() => {
				if (copiedField === field) copiedField = null;
			}, 1500);
		});
	}

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

<main class="mx-auto w-full max-w-6xl flex-grow px-4 py-6 sm:px-6 sm:py-8">
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
		<header class="mb-6 space-y-4 sm:mb-8">
			<div class="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
				<div class="min-w-0 space-y-2">
					<RoomTypePill type={roomType} />
					<h1 class="break-words text-2xl leading-tight sm:text-3xl">{room?.room_name}</h1>
				</div>
				<ParticipantAvatars {participants} currentUserId={userParticipant?.id} />
			</div>

			<!-- Share strip: everything a teammate needs to join -->
			<div
				class="flex flex-col gap-2 rounded-xl border bg-card p-2 shadow-soft sm:flex-row sm:flex-wrap sm:items-center"
				aria-label="Invite teammates"
				role="group"
			>
				<div class="flex min-w-0 items-center gap-2 rounded-lg px-2 py-1">
					<span class="text-sm text-muted-foreground">Code</span>
					<span
						class="font-mono text-[15px] font-medium tracking-wide text-foreground"
						data-testid="room-code">{room?.room_code}</span
					>
					<Button
						variant="ghost"
						size="icon"
						class="h-8 w-8"
						onclick={() => copyText('code', room?.room_code)}
						aria-label="Copy room code"
						title="Copy room code"
					>
						{#if copiedField === 'code'}<Check class="text-success" />{:else}<Copy />{/if}
					</Button>
				</div>

				<span class="hidden h-6 w-px bg-border sm:block" aria-hidden="true"></span>

				<div class="flex min-w-0 items-center gap-2 rounded-lg px-2 py-1">
					<span class="text-sm text-muted-foreground">Password</span>
					{#if showRoomPassword}
						<span
							class="min-w-0 truncate font-mono text-[15px] font-medium text-foreground"
							data-testid="room-password-value">{roomKey}</span
						>
					{:else}
						<span class="font-mono text-[15px] tracking-widest text-muted-foreground">••••••••</span
						>
					{/if}
					<Button
						data-testid="room-password-reveal"
						variant="ghost"
						size="icon"
						class="h-8 w-8"
						onclick={() => (showRoomPassword = !showRoomPassword)}
						aria-label={showRoomPassword ? 'Hide password' : 'Show password'}
						aria-pressed={showRoomPassword}
						title={showRoomPassword ? 'Hide password' : 'Show password'}
					>
						{#if showRoomPassword}<EyeOff />{:else}<Eye />{/if}
					</Button>
					{#if roomKey}
						<Button
							variant="ghost"
							size="icon"
							class="h-8 w-8"
							onclick={() => copyText('password', roomKey)}
							aria-label="Copy password"
							title="Copy password"
						>
							{#if copiedField === 'password'}<Check class="text-success" />{:else}<Copy />{/if}
						</Button>
					{/if}
				</div>

				<Button
					data-testid="copy-join-link"
					onclick={copyJoinLink}
					disabled={!roomKey}
					variant="secondary"
					class="sm:ml-auto"
					title={roomKey
						? 'Copy a link that includes the password'
						: 'Re-enter password to share link'}
				>
					{#if joinLinkCopied}<Check class="text-success" />{:else}<Link />{/if}
					{joinLinkCopied ? 'Copied!' : 'Copy invite link'}
				</Button>
				<span class="sr-only" aria-live="polite"
					>{joinLinkCopied || copiedField ? 'Copied to clipboard' : ''}</span
				>
			</div>
		</header>

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
</main>
