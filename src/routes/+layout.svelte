<script lang="ts">
	import '../app.css';
	import Header from './components/Header.svelte';
	import { inject } from '@vercel/analytics';
	let { children } = $props();

	inject();
</script>

<div class="flex flex-col bg-gradient-to-b from-blue-100 to-white">
	<Header />
	{@render children()}
</div>
