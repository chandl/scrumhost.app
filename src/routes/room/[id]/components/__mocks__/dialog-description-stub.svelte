<script lang="ts">
	let { children }: { children?: import('svelte').Snippet } = $props();
</script>
<p data-testid="dialog-description">
	{@render children?.()}
</p>
