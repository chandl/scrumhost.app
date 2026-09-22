<script lang="ts">
	import { cn } from '$lib/utils.js';
	import type { HTMLAttributes } from 'svelte/elements';

	let { class: className = undefined, ...restProps }: HTMLAttributes<HTMLDivElement> = $props();
</script>

<div role="separator" class={cn('-mx-1 my-1 h-px bg-muted', className)} {...restProps}></div>
