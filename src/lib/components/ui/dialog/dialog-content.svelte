<script lang="ts">
	import { Dialog as DialogPrimitive } from 'bits-ui';
	import X from 'lucide-svelte/icons/x';
	import * as Dialog from './index.js';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className = undefined,
		children,
		...restProps
	}: DialogPrimitive.ContentProps = $props();
</script>

<Dialog.Portal>
	<Dialog.Overlay />
	<DialogPrimitive.Content
		bind:ref
		class={cn(
			'fixed left-[50%] top-[50%] z-50 grid max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg translate-x-[-50%] translate-y-[-50%] animate-dialog-in gap-5 overflow-y-auto rounded-xl border bg-card p-6 shadow-2xl focus:outline-none',
			className
		)}
		{...restProps}
	>
		{@render children?.()}
		<DialogPrimitive.Close
			class="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none coarse:h-11 coarse:w-11"
		>
			<X class="h-4 w-4" />
			<span class="sr-only">Close</span>
		</DialogPrimitive.Close>
	</DialogPrimitive.Content>
</Dialog.Portal>
