import { cellAt, type Grid } from './grid.js';
import {
	BASE_WALL_HEIGHT,
	FLOOR_KIND_COUNT,
	FLOOR_PALETTE,
	MATERIAL_COUNT,
	MAX_WALL_HEIGHT,
	Material,
	PALETTE,
	PAPER,
	WALL_HEIGHTS,
	type Rgb
} from './materials.js';
import type { Player } from './player.js';
import { emptyHit, traceRay, type RayHit } from './raycast.js';

/** Height of an ordinary wall in cells; the eye sits at half of it. Headings are taller. */
export const WALL_HEIGHT = BASE_WALL_HEIGHT;
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
	/** Floor shades: [floor kind][fog level][0 paper, 1 ruling line]. */
	private readonly floorShades = new Uint32Array(FLOOR_KIND_COUNT * FOG_LEVELS * 2);
	private readonly hit = emptyHit();
	/** Hit distance per screen column (along the view direction). */
	depth = new Float32Array(0);

	constructor(readonly canvas: HTMLCanvasElement) {
		const ctx = canvas.getContext('2d');
		if (!ctx) throw new Error('2D canvas is not available');
		this.ctx = ctx;
		for (let k = 0; k < FLOOR_KIND_COUNT; k++) {
			for (let f = 0; f < FOG_LEVELS; f++) {
				const fog = f / (FOG_LEVELS - 1);
				// Tinted regions fade back to plain paper in the distance, like everything else.
				const paper = mix(FLOOR_PALETTE[k], PAPER, fog);
				const line = mix(mix(FLOOR_LINE, FLOOR_PALETTE[k], 0.35), PAPER, fog);
				const i = (k * FOG_LEVELS + f) * 2;
				this.floorShades[i] = pack(paper[0], paper[1], paper[2]);
				this.floorShades[i + 1] = pack(line[0], line[1], line[2]);
			}
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

		// Floor casting: squared paper ruling that fades out with distance, tinted under code and quotes.
		const floor = grid.floor;
		const gw = grid.width;
		const gh = grid.height;
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
				const cx = Math.floor(fx);
				const cy = Math.floor(fy);
				const kind = cx >= 0 && cy >= 0 && cx < gw && cy < gh ? floor[cy * gw + cx] : 0;
				px[i] = this.floorShades[kind * FOG_LEVELS * 2 + fogBase + (onLine ? 1 : 0)];
			}
		}

		// Walls, front to back. Each column keeps `clip`, the lowest screen row still free
		// above everything drawn so far; a farther, taller wall only fills the rows above it.
		let column = 0;
		let clip = h;
		let first = true;
		const visit = (hit: RayHit) => {
			const distance = Math.max(hit.distance, 1e-4);
			if (first) {
				this.depth[column] = distance;
				first = false;
			}
			const height = WALL_HEIGHTS[hit.material];
			const scale = focal / distance;
			const top = horizon - (height - eye) * scale;
			const y0 = Math.max(0, Math.floor(top));
			const y1 = Math.min(clip, Math.ceil(horizon + eye * scale));
			if (y0 < y1) this.drawSlice(grid, hit, distance, column, top, height * scale, y0, y1);
			clip = Math.min(clip, y0);
			// Stop once the column is full, nothing behind can be taller, or even the tallest
			// wall at this distance would already end below the free rows (it only gets lower).
			return (
				clip > 0 && height < MAX_WALL_HEIGHT && horizon - (MAX_WALL_HEIGHT - eye) * scale < clip
			);
		};
		for (column = 0; column < w; column++) {
			const camera = (2 * column) / w - 1;
			clip = h;
			first = true;
			this.depth[column] = MAX_DISTANCE;
			traceRay(
				grid,
				player.x,
				player.y,
				dirX + planeX * camera,
				dirY + planeY * camera,
				MAX_DISTANCE,
				this.hit,
				visit
			);
		}

		this.ctx.putImageData(this.image, 0, 0);
	}

	/** Paints rows [y0, y1) of one wall face into a screen column. */
	private drawSlice(
		grid: Grid,
		hit: RayHit,
		distance: number,
		x: number,
		top: number,
		lineHeight: number,
		y0: number,
		y1: number
	) {
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
		const capEnd = top + Math.min(lineHeight * 0.04, 6);
		const w = this.canvas.width;
		const px = this.pixels;
		for (let y = y0; y < y1; y++) px[y * w + x] = y < capEnd ? rim : body;
	}
}
