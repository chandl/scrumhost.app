<script lang="ts">
	let { class: className = '' }: { class?: string } = $props();
</script>

<span class="inline-flex items-center gap-2 font-semibold tracking-tight {className}">
	<!-- Two stacked cards: a quiet nod to planning poker -->
	<svg viewBox="0 0 24 24" class="h-6 w-6 shrink-0" aria-hidden="true">
		<rect x="7" y="3" width="13" height="16" rx="3" class="fill-primary/25" />
		<rect x="4" y="5" width="13" height="16" rx="3" class="fill-primary" />
	</svg>
	<span>scrumhost</span>
</span>
