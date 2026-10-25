<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';

	interface Props extends HTMLButtonAttributes {
		variant?: 'primary' | 'ghost';
	}

	let { variant = 'ghost', type = 'button', children, ...rest }: Props = $props();
</script>

<button class="button {variant}" {type} {...rest}>
	{@render children?.()}
</button>

<style>
	.button {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		height: var(--control-height);
		padding: 0 var(--space-3);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-sm);
		font: inherit;
		font-size: var(--font-size-200);
		white-space: nowrap;
		cursor: pointer;
		transition:
			background var(--duration-fast) var(--easing-standard),
			border-color var(--duration-fast) var(--easing-standard);
	}

	/* Owned here rather than by a global rule, so the ring survives in host pages too. */
	.button:focus-visible {
		outline: 2px solid var(--focus-ring);
		outline-offset: 2px;
	}

	.ghost {
		background: transparent;
		color: var(--text-primary);
	}

	.ghost:hover {
		border-color: var(--border-strong);
	}

	.primary {
		background: var(--accent);
		border-color: var(--accent);
		color: var(--text-on-accent);
	}

	.primary:hover {
		background: var(--accent-hover);
	}
</style>
