<script lang="ts">
	import { browser } from '$app/env';
	import welcome from '#lib/samples/welcome.md?raw';
	import GameView from '#lib/components/organisms/GameView.svelte';
	import Toolbar from '#lib/components/organisms/Toolbar.svelte';
	import { canvasMeasure } from '#lib/engine/rasterize.ts';
	import { buildWorld, type World } from '#lib/engine/world.ts';

	let source = $state({ name: 'welcome.md', text: welcome });
	// Layout needs real font metrics, so the world only exists in the browser (not when prerendering).
	const world: World | undefined = $derived(
		browser ? buildWorld(source.text, canvasMeasure()) : undefined
	);
	let dragging = $state(false);

	function load(name: string, text: string) {
		source = { name, text };
	}

	async function drop(event: DragEvent) {
		event.preventDefault();
		dragging = false;
		const file = event.dataTransfer?.files[0];
		if (file) load(file.name, await file.text());
	}
</script>

<svelte:head>
	<title>markdown-raycast — {source.name}</title>
</svelte:head>

<svelte:window
	ondragover={(event) => {
		event.preventDefault();
		dragging = true;
	}}
	ondragleave={(event) => {
		if (!event.relatedTarget) dragging = false;
	}}
	ondrop={drop}
/>

<main class={['app', { dragging }]}>
	<Toolbar documentName={source.name} onload={load} onsample={() => load('welcome.md', welcome)} />
	{#if world}
		<GameView {world} />
	{:else}
		<p class="loading">Laying out the page…</p>
	{/if}
</main>

<style>
	.app {
		display: flex;
		flex-direction: column;
		height: 100dvh;
	}

	.dragging {
		outline: 4px dashed var(--accent);
		outline-offset: -4px;
	}

	.loading {
		margin: auto;
		color: var(--text-secondary);
	}
</style>
