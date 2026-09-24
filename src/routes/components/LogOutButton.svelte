<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import {
		AlertDialog,
		AlertDialogAction,
		AlertDialogCancel,
		AlertDialogContent,
		AlertDialogDescription,
		AlertDialogFooter,
		AlertDialogHeader,
		AlertDialogTitle
	} from '$lib/components/ui/alert-dialog';
	import { Button } from '$lib/components/ui/button';
	import { logout, user } from '$lib/scrum/user';
	import { DoorOpen, House, LogOut } from 'lucide-svelte';
	import type { AuthModel } from 'pocketbase';

	let showConfirmDialog = $state(false);

	let isNotRootPage = $derived($page.url.pathname !== '/');
	let isNotHomePage = $derived($page.url.pathname !== '/home');
	let isInRoom = $derived($page.url.pathname.startsWith('/room/'));

	let currentUser: AuthModel = $state(null);
	user.subscribe((value) => {
		currentUser = value;
	});

	async function handleLogout() {
		logout();
		goto('/');
	}
</script>

{#if currentUser != null && isNotRootPage}
	{#if isNotHomePage}
		<Button variant="ghost" on:click={() => goto('/home')} title={isInRoom ? 'Leave room' : 'Home'}>
			{#if isInRoom}
				<DoorOpen aria-hidden="true" />
				<span class="hidden sm:inline">Leave room</span>
				<span class="sr-only sm:hidden">Leave room</span>
			{:else}
				<House aria-hidden="true" />
				<span class="hidden sm:inline">Home</span>
				<span class="sr-only sm:hidden">Home</span>
			{/if}
		</Button>
	{/if}
	<Button
		variant="ghost"
		size="icon"
		on:click={() => (showConfirmDialog = true)}
		aria-label="Log out"
		title="Log out"
	>
		<LogOut aria-hidden="true" />
	</Button>

	<AlertDialog
		open={showConfirmDialog}
		onOpenChange={() => {
			showConfirmDialog = !showConfirmDialog;
		}}
	>
		<AlertDialogContent class="max-w-md">
			<AlertDialogHeader>
				<AlertDialogTitle>Log out?</AlertDialogTitle>
				<AlertDialogDescription>
					You'll need to enter your name again to rejoin your rooms.
				</AlertDialogDescription>
			</AlertDialogHeader>
			<AlertDialogFooter>
				<AlertDialogCancel>Cancel</AlertDialogCancel>
				<AlertDialogAction onclick={handleLogout}>Log out</AlertDialogAction>
			</AlertDialogFooter>
		</AlertDialogContent>
	</AlertDialog>
{/if}
