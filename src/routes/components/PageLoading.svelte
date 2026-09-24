<script lang="ts">
	import { Skeleton } from '$lib/components/ui/skeleton';
</script>

<!-- Skeleton shaped like the room header + main cards, so content lands without a jump -->
<div class="space-y-6" aria-busy="true" aria-live="polite">
	<span class="sr-only">Loading room…</span>
	<div class="space-y-3">
		<Skeleton class="h-9 w-2/3 max-w-sm" />
		<div class="flex flex-wrap gap-2">
			<Skeleton class="h-8 w-28 rounded-full" />
			<Skeleton class="h-8 w-40" />
			<Skeleton class="h-8 w-32" />
		</div>
	</div>
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
		<Skeleton class="h-72 rounded-xl" />
		<div class="space-y-4">
			<Skeleton class="h-32 rounded-xl" />
			<Skeleton class="h-48 rounded-xl" />
		</div>
	</div>
</div>
