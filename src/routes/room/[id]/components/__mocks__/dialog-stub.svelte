<script lang="ts">
	let { open = true, children }: { open?: boolean; children?: import('svelte').Snippet } = $props();
</script>

{#if open}
	{@render children?.()}
{/if}
