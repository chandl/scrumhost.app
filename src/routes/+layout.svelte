<script lang="ts">
	import '../app.css';
	import LogOutButton from './components/LogOutButton.svelte';
	let { children } = $props();
</script>

<LogOutButton />
{@render children()}
