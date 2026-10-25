import { cellAt, type Grid } from './grid.js';
import { MATERIAL_COUNT, Material, PALETTE, PAPER, type Rgb } from './materials.js';
import type { Player } from './player.js';
import { castRay, emptyHit } from './raycast.js';

/** How tall walls are, in cells. Glyph strokes are 1–5 cells thick, so walls tower over you. */
export const WALL_HEIGHT = 10;
export const MAX_DISTANCE = 220;
export const FOV = (70 * Math.PI) / 180;

const SKY_TOP: Rgb = [176, 196, 214];
const FLOOR_LINE: Rgb = [205, 214, 230];
/** Floor ruling every N cells, like squared notebook paper. */
const RULING = 8;

function pack(r: number, g: number, b: number): number {
	// ImageData is RGBA in memory; on little-endian hosts that is ABGR as a uint32.
	return (255 << 24) | (Math.round(b) << 16) | (Math.round(g) << 8) | Math.round(r);
}

function mix(a: Rgb, b: Rgb, t: number): Rgb {
	return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/** Fog levels are quantised so every shade can be precomputed. */
const FOG_LEVELS = 64;
/** Wall shades per material: [fog level][shade: 0 lit, 1 side, 2 edge, 3 side+edge]. */
function buildWallShades(): Uint32Array {
	const shades = new Uint32Array(MATERIAL_COUNT * FOG_LEVELS * 4);
	for (let m = 0; m < MATERIAL_COUNT; m++) {
		for (let f = 0; f < FOG_LEVELS; f++) {
			const fog = f / (FOG_LEVELS - 1);
			for (let s = 0; s < 4; s++) {
				const k = (s & 1 ? 0.72 : 1) * (s & 2 ? 1.35 : 1);
				const base = PALETTE[m];
				const lit: Rgb = [
					Math.min(255, base[0] * k + (s & 2 ? 18 : 0)),
					Math.min(255, base[1] * k + (s & 2 ? 18 : 0)),
					Math.min(255, base[2] * k + (s & 2 ? 18 : 0))
				];
				const c = mix(lit, PAPER, fog);
				shades[(m * FOG_LEVELS + f) * 4 + s] = pack(c[0], c[1], c[2]);
			}
		}
	}
	return shades;
}

function fogLevel(distance: number): number {
	const t = Math.min(1, distance / MAX_DISTANCE);
	return Math.min(FOG_LEVELS - 1, Math.floor(Math.pow(t, 0.8) * FOG_LEVELS));
}

/**
 * Software raycaster drawing into an ImageData buffer. Besides pixels it keeps
 * the per-column hit distances so the minimap can draw the visible area.
 */
export class Renderer {
	readonly ctx: CanvasRenderingContext2D;
	private image!: ImageData;
	private pixels!: Uint32Array;
	private readonly shades = buildWallShades();
	private readonly floorShades = new Uint32Array(FOG_LEVELS * 2);
	private readonly hit = emptyHit();
	/** Hit distance per screen column (along the view direction). */
	depth = new Float32Array(0);

	constructor(readonly canvas: HTMLCanvasElement) {
		const ctx = canvas.getContext('2d');
		if (!ctx) throw new Error('2D canvas is not available');
		this.ctx = ctx;
		for (let f = 0; f < FOG_LEVELS; f++) {
			const fog = f / (FOG_LEVELS - 1);
			const line = mix(FLOOR_LINE, PAPER, fog);
			this.floorShades[f * 2] = pack(PAPER[0], PAPER[1], PAPER[2]);
			this.floorShades[f * 2 + 1] = pack(line[0], line[1], line[2]);
		}
		this.resize(canvas.width, canvas.height);
	}

	resize(width: number, height: number) {
		this.canvas.width = Math.max(1, Math.floor(width));
		this.canvas.height = Math.max(1, Math.floor(height));
		this.image = this.ctx.createImageData(this.canvas.width, this.canvas.height);
		this.pixels = new Uint32Array(this.image.data.buffer);
		this.depth = new Float32Array(this.canvas.width);
	}

	get width() {
		return this.canvas.width;
	}

	/** Pixel distance from the eye to the projection plane. */
	get focal() {
		return this.width / 2 / Math.tan(FOV / 2);
	}

	render(grid: Grid, player: Player) {
		const { width: w, height: h } = this.canvas;
		const px = this.pixels;
		const focal = this.focal;
		const horizon = h / 2;
		const eye = WALL_HEIGHT / 2;

		const dirX = Math.cos(player.angle);
		const dirY = Math.sin(player.angle);
		const planeScale = Math.tan(FOV / 2);
		const planeX = -dirY * planeScale;
		const planeY = dirX * planeScale;

		// Sky: a soft gradient that fades into the paper at the horizon.
		for (let y = 0; y < horizon; y++) {
			const c = mix(SKY_TOP, PAPER, Math.pow(y / horizon, 1.6));
			px.fill(pack(c[0], c[1], c[2]), y * w, (y + 1) * w);
		}

		// Floor casting: squared paper ruling that fades out with distance.
		const leftX = dirX - planeX;
		const leftY = dirY - planeY;
		const spanX = (2 * planeX) / w;
		const spanY = (2 * planeY) / w;
		for (let y = Math.ceil(horizon); y < h; y++) {
			const rowDistance = (eye * focal) / (y - horizon + 0.5);
			const fogBase = fogLevel(rowDistance) * 2;
			let fx = player.x + rowDistance * leftX;
			let fy = player.y + rowDistance * leftY;
			const sx = rowDistance * spanX;
			const sy = rowDistance * spanY;
			// Thinner lines up close, but never under a pixel wide far away.
			const lineWidth = Math.max(0.08, Math.abs(sx) + Math.abs(sy));
			let i = y * w;
			for (let x = 0; x < w; x++, i++, fx += sx, fy += sy) {
				const ux = fx / RULING;
				const uy = fy / RULING;
				const onLine =
					ux - Math.floor(ux) < lineWidth / RULING || uy - Math.floor(uy) < lineWidth / RULING;
				px[i] = this.floorShades[fogBase + (onLine ? 1 : 0)];
			}
		}

		// Walls.
		const hit = this.hit;
		for (let x = 0; x < w; x++) {
			const camera = (2 * x) / w - 1;
			const rayX = dirX + planeX * camera;
			const rayY = dirY + planeY * camera;
			if (!castRay(grid, player.x, player.y, rayX, rayY, MAX_DISTANCE, hit)) {
				this.depth[x] = MAX_DISTANCE;
				continue;
			}
			const distance = Math.max(hit.distance, 1e-4);
			this.depth[x] = distance;

			const lineHeight = (WALL_HEIGHT * focal) / distance;
			const top = horizon - lineHeight / 2;
			const y0 = Math.max(0, Math.floor(top));
			const y1 = Math.min(h, Math.ceil(horizon + lineHeight / 2));

			// Outline only where the glyph's face ends, not on every cell seam along it.
			let edge = 0;
			if (hit.wallX < 0.07 || hit.wallX > 0.93) {
				const step = hit.wallX < 0.5 ? -1 : 1;
				const neighbour =
					hit.side === 0
						? cellAt(grid, hit.cellX, hit.cellY + step)
						: cellAt(grid, hit.cellX + step, hit.cellY);
				if (neighbour === Material.Empty) edge = 2;
			}
			const base = ((hit.material * FOG_LEVELS + fogLevel(distance)) << 2) | hit.side;
			const body = this.shades[base | edge];
			const rim = this.shades[base | 2];
			// A lighter cap band at the top of each wall reads as the glyph's "surface".
			const capEnd = top + lineHeight * 0.04;
			for (let y = y0; y < y1; y++) px[y * w + x] = y < capEnd ? rim : body;
		}

		this.ctx.putImageData(this.image, 0, 0);
	}
}
