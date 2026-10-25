<script lang="ts">
	import { canvasMeasure } from '../engine/rasterize.js';
	import { buildWorld, type World } from '../engine/world.js';
	import GameView from './organisms/GameView.svelte';

	interface Props {
		/** The Markdown document to walk through. Changing it rebuilds the world. */
		markdown: string;
		class?: string;
	}

	let { markdown, class: className = '' }: Props = $props();

	// Layout needs real font metrics, so the world only exists in the browser (not during SSR).
	const world: World | undefined = $derived(
		typeof document === 'undefined' ? undefined : buildWorld(markdown, canvasMeasure())
	);
</script>

<div class="raycaster {className}">
	{#if world}
		<GameView {world} />
	{:else}
		<p class="loading">Laying out the page…</p>
	{/if}
</div>

<style>
	.raycaster {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
		min-height: 0;
		font-family: var(--font-family-sans);
		line-height: var(--line-height-normal);
		color: var(--text-primary);
	}

	/* The host page's box model is unknown; the component's own layout assumes border-box. */
	.raycaster :global(*),
	.raycaster :global(*::before),
	.raycaster :global(*::after) {
		box-sizing: border-box;
	}

	.loading {
		margin: auto;
		color: var(--text-secondary);
	}
</style>
