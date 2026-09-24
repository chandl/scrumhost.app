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
	import { Label } from '$lib/components/ui/label';
	import { CircleAlert, KeyRound } from 'lucide-svelte';

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
	<DialogContent class="sm:max-w-md">
		<DialogHeader>
			<div
				class="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"
			>
				<KeyRound class="h-5 w-5" aria-hidden="true" />
			</div>
			<DialogTitle>Join Room</DialogTitle>
			<DialogDescription>Enter the room password.</DialogDescription>
		</DialogHeader>
		<form
			id="join-room-form"
			class="grid gap-2"
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
			<Label for="room-password" class="sr-only">Room password</Label>
			<Input
				id="room-password"
				data-testid="join-room-password"
				bind:value={roomPassword}
				class="h-12 text-base {error ? 'border-destructive focus-visible:ring-destructive/20' : ''}"
				placeholder="Enter room password"
				autocomplete="off"
				aria-invalid={error ? 'true' : undefined}
				aria-describedby={error ? 'join-room-error' : undefined}
				autofocus
			/>
			{#if error}
				<p
					id="join-room-error"
					class="flex animate-rise-in items-center gap-1.5 text-sm text-destructive"
					role="alert"
					data-testid="join-room-error"
				>
					<CircleAlert class="h-4 w-4 shrink-0" aria-hidden="true" />
					<span>{error}</span>
				</p>
			{/if}
			<p class="text-sm text-muted-foreground">
				Ask whoever shared the room code, or use their invite link to skip this step.
			</p>
		</form>
		<DialogFooter>
			<Button type="submit" form="join-room-form" size="lg" class="w-full" disabled={isSubmitting}
				>Join Room</Button
			>
		</DialogFooter>
	</DialogContent>
</Dialog>
