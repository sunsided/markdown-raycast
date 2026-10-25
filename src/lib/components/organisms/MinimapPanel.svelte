<script lang="ts">
	import Panel from '../atoms/Panel.svelte';

	interface Props {
		canvas?: HTMLCanvasElement;
		/** Called with minimap pixel coordinates (in canvas pixels) when clicked. */
		onjump: (x: number, y: number) => void;
	}

	let { canvas = $bindable(), onjump }: Props = $props();

	function click(event: MouseEvent) {
		if (!canvas) return;
		const rect = canvas.getBoundingClientRect();
		onjump(
			((event.clientX - rect.left) / rect.width) * canvas.width,
			((event.clientY - rect.top) / rect.height) * canvas.height
		);
	}
</script>

<Panel class="minimap">
	<canvas bind:this={canvas} onclick={click} aria-label="Minimap of the document"></canvas>
</Panel>

<style>
	:global(.minimap) {
		padding: var(--space-1);
		line-height: 0;
	}

	canvas {
		width: var(--minimap-width);
		height: var(--minimap-height);
		border-radius: var(--radius-sm);
		cursor: crosshair;
	}
</style>
