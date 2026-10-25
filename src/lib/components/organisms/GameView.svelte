<script lang="ts">
	import { Controls, GAME_KEYS } from '../../engine/controls';
	import { Minimap } from '../../engine/minimap';
	import { collides, type Player } from '../../engine/player';
	import { Renderer } from '../../engine/renderer';
	import { sectionAt, type World } from '../../engine/world';
	import FilmGrain from '../atoms/FilmGrain.svelte';
	import ControlsHelp from './ControlsHelp.svelte';
	import Hud from './Hud.svelte';
	import MinimapPanel from './MinimapPanel.svelte';

	/** Internal render resolution relative to CSS pixels; the canvas is upscaled pixelated. */
	const RESOLUTION = 0.5;

	let { world }: { world: World } = $props();

	let canvas: HTMLCanvasElement;
	let minimapCanvas = $state<HTMLCanvasElement>();
	let focused = $state(false);
	let showMinimap = $state(true);
	let section = $state({ title: '', depth: 1, progress: 0 });

	const controls = new Controls();
	let player: Player = { x: 0, y: 0, angle: 0 };
	let minimap: Minimap | undefined;

	$effect(() => {
		player = { ...world.spawn };
		minimap = new Minimap(world.grid);
	});

	// Size the minimap's backing store only when its CSS box changes; reading layout every
	// frame would force a reflow. Re-runs when the minimap is toggled back on.
	$effect(() => {
		const target = minimapCanvas;
		if (!target) return;
		const observer = new ResizeObserver(([entry]) => {
			const width = Math.round(entry.contentRect.width);
			const height = Math.round(entry.contentRect.height);
			if (target.width !== width) target.width = width;
			if (target.height !== height) target.height = height;
		});
		observer.observe(target);
		return () => observer.disconnect();
	});

	$effect(() => {
		const renderer = new Renderer(canvas);
		const observer = new ResizeObserver(([entry]) => {
			const { width, height } = entry.contentRect;
			renderer.resize(width * RESOLUTION, height * RESOLUTION);
		});
		observer.observe(canvas);

		let frame = 0;
		let last = performance.now();
		const tick = (now: number) => {
			const dt = Math.min(0.05, (now - last) / 1000);
			last = now;
			controls.update(world.grid, player, dt);
			renderer.render(world.grid, player);

			if (minimapCanvas && minimap) {
				const ctx = minimapCanvas.getContext('2d');
				if (ctx) minimap.draw(ctx, player, renderer.depth);
			}

			const current = sectionAt(world.layout.sections, player.y);
			section.title = current?.title ?? 'Front matter';
			section.depth = current?.depth ?? 1;
			section.progress = Math.round((player.y / world.grid.height) * 200) / 200;

			frame = requestAnimationFrame(tick);
		};
		frame = requestAnimationFrame(tick);

		return () => {
			cancelAnimationFrame(frame);
			observer.disconnect();
		};
	});

	function start() {
		canvas.focus();
		// Pointer lock is optional (e.g. unavailable in iframes); keyboard turning still works.
		canvas.requestPointerLock?.()?.catch(() => {});
	}

	function jump(mx: number, my: number) {
		if (!minimapCanvas || !minimap) return;
		const view = minimap.view(minimapCanvas.width, minimapCanvas.height, player);
		const target = minimap.toPage(view, mx, my);
		if (!collides(world.grid, target.x, target.y)) {
			player.x = target.x;
			player.y = target.y;
		}
	}

	function keydown(event: KeyboardEvent) {
		if (!focused) return;
		if (event.code === 'KeyM') {
			showMinimap = !showMinimap;
			return;
		}
		if (GAME_KEYS.has(event.code)) event.preventDefault();
		controls.press(event.code);
	}

	function mousemove(event: MouseEvent) {
		if (document.pointerLockElement === canvas) controls.look(event.movementX);
	}
</script>

<svelte:window
	onkeydown={keydown}
	onkeyup={(event) => controls.release(event.code)}
	onblur={() => controls.clear()}
/>
<svelte:document onmousemove={mousemove} />

<div class="game">
	<canvas
		bind:this={canvas}
		class="view"
		tabindex="0"
		aria-label="3D view of the document"
		onclick={start}
		onfocus={() => (focused = true)}
		onblur={() => {
			focused = false;
			controls.clear();
		}}
	></canvas>

	<FilmGrain />

	<div class="top-left">
		<Hud {...section} />
	</div>

	{#if showMinimap}
		<div class="top-right">
			<MinimapPanel bind:canvas={minimapCanvas} onjump={jump} />
		</div>
	{/if}

	{#if !focused}
		<div class="overlay">
			<button class="start" onclick={start} aria-label="Start walking">
				<ControlsHelp />
			</button>
		</div>
	{/if}
</div>

<style>
	.game {
		position: relative;
		flex: 1;
		min-height: 0;
		overflow: hidden;
	}

	.view {
		display: block;
		width: 100%;
		height: 100%;
		image-rendering: pixelated;
		cursor: crosshair;
		outline: none;
	}

	.top-left,
	.top-right {
		position: absolute;
		top: var(--space-4);
		z-index: var(--z-hud);
	}

	.top-left {
		left: var(--space-4);
	}

	.top-right {
		right: var(--space-4);
	}

	.overlay {
		position: absolute;
		inset: 0;
		z-index: var(--z-overlay);
		display: grid;
		place-items: center;
		padding: var(--space-4);
		background: var(--surface-scrim);
	}

	.start {
		padding: 0;
		border: none;
		background: none;
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	@media (max-width: 640px) {
		.top-left {
			top: auto;
			bottom: var(--space-4);
		}
	}
</style>
