<script lang="ts">
	let { children }: { children?: import('svelte').Snippet } = $props();
</script>

<div data-testid="dialog-footer">
	{@render children?.()}
</div>
