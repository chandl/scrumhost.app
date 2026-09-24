<script lang="ts">
	import '../app.css';
	import Header from './components/Header.svelte';
	import { inject } from '@vercel/analytics';
	import { ModeWatcher } from 'mode-watcher';
	import { TooltipProvider } from '$lib/components/ui/tooltip';
	let { children } = $props();

	inject();
</script>

<ModeWatcher themeColors={{ light: '#fafaf7', dark: '#09090b' }} />
<TooltipProvider delayDuration={200}>
	<div class="flex min-h-dvh flex-col">
		<Header />
		{@render children()}
	</div>
</TooltipProvider>
