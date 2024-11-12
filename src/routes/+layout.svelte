<script lang="ts">
	import '../app.css';
	import LogOutButton from './components/LogOutButton.svelte';
	import { inject } from '@vercel/analytics';
	let { children } = $props();

	inject();
</script>

<LogOutButton />
{@render children()}
