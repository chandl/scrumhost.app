<script lang="ts">
	import '../app.css';
	import Header from './components/Header.svelte';
	import { inject } from '@vercel/analytics';
	import { ModeWatcher } from 'mode-watcher';
	import ThemeSwitchButton from './components/ThemeSwitchButton.svelte';
	let { children } = $props();

	inject();
</script>

<ModeWatcher />
<div class="flex flex-col dark:bg-gray-950">
	<Header />
	{@render children()}
	<ThemeSwitchButton />
</div>
