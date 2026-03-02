<script lang="ts">
	let { open = true, children }: { open?: boolean; children?: import('svelte').Snippet } = $props();
</script>
<!-- Always render children so trigger and content are in DOM for tests -->
{@render children?.()}
