<script lang="ts">
	import { goto } from '$app/navigation';
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
	import { logout, user } from '$lib/user';
	import { LogOut } from 'lucide-svelte';
	import type { AuthModel } from 'pocketbase';

	let showConfirmDialog = $state(false);

	let currentUser: AuthModel = $state(null);
	user.subscribe((value) => {
		currentUser = value;
	});

	async function handleLogout() {
		logout();
		goto('/login');
	}
</script>

{#if currentUser != null}
	<div>
		<Button
			variant="outline"
			size="icon"
			class="fixed right-4 top-4 rounded-full bg-background p-2 text-foreground shadow-md transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
			on:click={() => (showConfirmDialog = true)}
			aria-label="Logout"
		>
			<LogOut class="h-5 w-5" />
		</Button>

		<AlertDialog
			open={showConfirmDialog}
			onOpenChange={() => {
				showConfirmDialog = !showConfirmDialog;
			}}
		>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
					<AlertDialogDescription>
						This action will end your current session and return you to the login screen.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction on:click={handleLogout}>Logout</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	</div>
{/if}
