<script lang="ts">
	import { page } from '$app/stores';
	import LogOutButton from './LogOutButton.svelte';
	import ThemeSwitchButton from './ThemeSwitchButton.svelte';
	import Logo from './Logo.svelte';
	let isNotRootPage = $derived($page.url.pathname !== '/');
</script>

{#if isNotRootPage}
	<header
		class="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70"
	>
		<div class="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
			<a
				href="/"
				class="-ml-1.5 rounded-md px-1.5 py-1 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				aria-label="scrumhost home"
			>
				<Logo />
			</a>
			<div class="flex items-center gap-1">
				<LogOutButton />
				<ThemeSwitchButton />
			</div>
		</div>
	</header>
{/if}
