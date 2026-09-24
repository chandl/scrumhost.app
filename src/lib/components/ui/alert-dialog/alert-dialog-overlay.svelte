<script lang="ts">
	import { AlertDialog as AlertDialogPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className = undefined,
		...restProps
	}: AlertDialogPrimitive.OverlayProps = $props();
</script>

<AlertDialogPrimitive.Overlay
	bind:ref
	class={cn('fixed inset-0 z-50 animate-fade-in bg-black/30 dark:bg-black/60', className)}
	{...restProps}
/>
