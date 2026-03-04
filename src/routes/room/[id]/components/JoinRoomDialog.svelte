<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle
	} from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';

	let isOpen = $state(true);
	let roomPassword = $state('');

	let {
		handleJoinRoom,
		error = null,
		onDismiss
	}: {
		handleJoinRoom: (password: string) => void | Promise<void>;
		error?: string | null;
		onDismiss?: () => void;
	} = $props();

	function handleOpenChange(open: boolean) {
		isOpen = open;
		if (!open) {
			onDismiss?.();
		}
	}
</script>

<Dialog open={isOpen} onOpenChange={handleOpenChange}>
	<DialogContent class="sm:max-w-[425px]">
		<DialogHeader>
			<DialogTitle>Join Room</DialogTitle>
			<DialogDescription>Enter the room password.</DialogDescription>
		</DialogHeader>
		<div class="grid gap-2 py-2">
			<form
				class="flex flex-col gap-2"
				onsubmit={(e) => {
					e.preventDefault();
					handleJoinRoom(roomPassword);
					isOpen = false;
				}}
			>
				<Input
					id="room-password"
					data-testid="join-room-password"
					bind:value={roomPassword}
					class="col-span-3"
					placeholder="Enter room password"
					autofocus
				/>
				{#if error}
					<p class="text-sm text-destructive" data-testid="join-room-error" role="alert">
						{error}
					</p>
				{/if}
			</form>
		</div>
		<DialogFooter>
			<Button on:click={() => handleJoinRoom(roomPassword)}>Join Room</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
