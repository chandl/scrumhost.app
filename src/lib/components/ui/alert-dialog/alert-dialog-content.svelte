<script lang="ts">
	import { AlertDialog as AlertDialogPrimitive } from 'bits-ui';
	import * as AlertDialog from './index.js';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className = undefined,
		...restProps
	}: AlertDialogPrimitive.ContentProps = $props();
</script>

<AlertDialog.Portal>
	<AlertDialog.Overlay />
	<AlertDialogPrimitive.Content
		bind:ref
		class={cn(
			'fixed left-[50%] top-[50%] z-50 grid max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg translate-x-[-50%] translate-y-[-50%] animate-dialog-in gap-5 overflow-y-auto rounded-xl border bg-card p-6 shadow-2xl focus:outline-none',
			className
		)}
		{...restProps}
	/>
</AlertDialog.Portal>
