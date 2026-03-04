<script lang="ts">
	let { children }: { children?: import('svelte').Snippet } = $props();
</script>

<h2 data-testid="dialog-title">
	{@render children?.()}
</h2>
