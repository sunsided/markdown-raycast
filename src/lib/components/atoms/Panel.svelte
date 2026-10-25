<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';

	let { children, class: className = '', ...rest }: HTMLAttributes<HTMLDivElement> = $props();
</script>

<div class="panel {className}" {...rest}>
	{@render children?.()}
</div>

<style>
	.panel {
		padding: var(--panel-padding);
		border: 1px solid var(--border-subtle);
		border-radius: var(--panel-radius);
		background: var(--surface-panel);
		box-shadow: var(--shadow-panel);
		backdrop-filter: blur(6px);
		color: var(--text-primary);
	}
</style>
