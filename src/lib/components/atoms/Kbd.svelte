<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<kbd>{@render children()}</kbd>

<style>
	kbd {
		display: inline-block;
		min-width: 1.6em;
		padding: 0 var(--space-1);
		border: 1px solid var(--border-subtle);
		border-bottom-width: 2px;
		border-radius: var(--radius-sm);
		background: var(--surface-sunken);
		color: var(--text-primary);
		font-family: var(--font-family-mono);
		font-size: var(--font-size-100);
		line-height: var(--line-height-normal);
		text-align: center;
	}
</style>
