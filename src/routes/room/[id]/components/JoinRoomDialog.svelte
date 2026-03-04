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
	let isSubmitting = $state(false);

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
				id="join-room-form"
				class="flex flex-col gap-2"
				onsubmit={async (e) => {
					e.preventDefault();
					if (isSubmitting) return;
					isSubmitting = true;
					try {
						await handleJoinRoom(roomPassword);
						// Do not set isOpen = false here. On success the parent unmounts the dialog
						// (requirePassword = false). On validation failure the parent sets error and we
						// stay open so the user sees the message.
					} finally {
						isSubmitting = false;
					}
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
			<Button type="submit" form="join-room-form" disabled={isSubmitting}>Join Room</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
