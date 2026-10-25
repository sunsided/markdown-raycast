<script lang="ts">
	import Kbd from '../atoms/Kbd.svelte';

	let { keys, label }: { keys: string[]; label: string } = $props();
</script>

<div class="hint">
	<span class="keys">
		{#each keys as key (key)}<Kbd>{key}</Kbd>{/each}
	</span>
	<span class="label">{label}</span>
</div>

<style>
	.hint {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--font-size-200);
	}

	.keys {
		display: inline-flex;
		gap: var(--space-1);
		min-width: 6.5rem;
	}

	.label {
		color: var(--text-secondary);
	}
</style>
