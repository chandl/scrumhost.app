<script lang="ts">
	import { page } from '$app/stores';
	import LogOutButton from './LogOutButton.svelte';
	let isNotRootPage = $derived($page.url.pathname !== '/');
</script>

{#if isNotRootPage}
	<header class="absolute px-4 py-6 sm:px-6 lg:px-8">
		<div class="mx-auto flex max-w-7xl items-center justify-between">
			<a href="/">
				<h1 class="text-2xl font-bold text-gray-900">scrum.host</h1>
			</a>
			<LogOutButton />
		</div>
	</header>
{/if}
