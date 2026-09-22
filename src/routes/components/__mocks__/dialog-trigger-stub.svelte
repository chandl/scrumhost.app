<script lang="ts">
	let {
		children,
		child
	}: {
		children?: import('svelte').Snippet;
		child?: import('svelte').Snippet<[{ props: Record<string, unknown> }]>;
	} = $props();
</script>

{#if child}
	{@render child({ props: {} })}
{:else}
	{@render children?.()}
{/if}
