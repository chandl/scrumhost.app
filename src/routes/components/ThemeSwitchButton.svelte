<script lang="ts">
	import { toggleMode } from 'mode-watcher';
	import { Button } from '$lib/components/ui/button';
	import { Moon, Sun } from 'lucide-svelte';
</script>

<Button on:click={toggleMode} variant="ghost" size="icon" title="Toggle light/dark theme">
	<Sun class="dark:hidden" aria-hidden="true" />
	<Moon class="hidden dark:block" aria-hidden="true" />
	<span class="sr-only">Toggle theme</span>
</Button>
