<script lang="ts">
	import Toolbar from '#lib/components/organisms/Toolbar.svelte';
	// The demo consumes the same entry point as the published package.
	import { MarkdownRaycaster } from '#lib/svelte.ts';
	import welcome from './welcome.md?raw';

	let source = $state({ name: 'welcome.md', text: welcome });
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
	<MarkdownRaycaster markdown={source.text} class="game" />
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

	.app :global(.game) {
		flex: 1;
	}
</style>
