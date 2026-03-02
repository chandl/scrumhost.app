<script lang="ts">
	let { children }: { children?: import('svelte').Snippet } = $props();
</script>
<div data-testid="dialog-header">
	{@render children?.()}
</div>
