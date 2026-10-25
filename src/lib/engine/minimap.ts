import type { Grid } from './grid.js';
import { FOV } from './renderer.js';
import { PALETTE } from './materials.js';
import type { Player } from './player.js';

export interface MinimapView {
	/** Page units per minimap pixel. */
	scale: number;
	/** Top of the visible page window in page units. */
	top: number;
}

/**
 * The minimap is the page itself: every wall cell painted in its ink colour,
 * scrolled to follow the player, with the visible area drawn as a cone.
 */
export class Minimap {
	private readonly page: HTMLCanvasElement;

	constructor(readonly grid: Grid) {
		this.page = document.createElement('canvas');
		this.page.width = grid.width;
		this.page.height = grid.height;
		const ctx = this.page.getContext('2d');
		if (!ctx) throw new Error('2D canvas is not available');
		const image = ctx.createImageData(grid.width, grid.height);
		const data = image.data;
		for (let i = 0; i < grid.cells.length; i++) {
			const [r, g, b] = PALETTE[grid.cells[i]];
			data[i * 4] = r;
			data[i * 4 + 1] = g;
			data[i * 4 + 2] = b;
			data[i * 4 + 3] = 255;
		}
		ctx.putImageData(image, 0, 0);
	}

	/** Fits the page width into the minimap and keeps the player vertically centred. */
	view(width: number, height: number, player: Player): MinimapView {
		const scale = this.grid.width / width;
		const visible = height * scale;
		const top = Math.min(
			Math.max(0, player.y - visible / 2),
			Math.max(0, this.grid.height - visible)
		);
		return { scale, top };
	}

	/** Converts a minimap pixel back to page coordinates (for click-to-teleport). */
	toPage(view: MinimapView, mx: number, my: number) {
		return { x: mx * view.scale, y: view.top + my * view.scale };
	}

	draw(ctx: CanvasRenderingContext2D, player: Player, depth: Float32Array) {
		const { width, height } = ctx.canvas;
		const view = this.view(width, height, player);
		const { scale, top } = view;

		ctx.imageSmoothingEnabled = true;
		ctx.clearRect(0, 0, width, height);
		ctx.drawImage(this.page, 0, top, this.grid.width, height * scale, 0, 0, width, height);

		const sx = player.x / scale;
		const sy = (player.y - top) / scale;

		// View cone from the renderer's per-column depth, sampled sparsely.
		if (depth.length > 0) {
			const dirX = Math.cos(player.angle);
			const dirY = Math.sin(player.angle);
			const plane = Math.tan(FOV / 2);
			ctx.beginPath();
			ctx.moveTo(sx, sy);
			const stride = Math.max(1, Math.floor(depth.length / 64));
			for (let x = 0; x < depth.length; x += stride) {
				const camera = (2 * x) / depth.length - 1;
				const rx = dirX - dirY * plane * camera;
				const ry = dirY + dirX * plane * camera;
				ctx.lineTo(sx + (rx * depth[x]) / scale, sy + (ry * depth[x]) / scale);
			}
			ctx.closePath();
			ctx.fillStyle = 'rgba(255, 196, 0, 0.28)';
			ctx.fill();
		}

		// Player arrow, kept a constant on-screen size.
		const size = 7;
		ctx.save();
		ctx.translate(sx, sy);
		ctx.rotate(player.angle);
		ctx.beginPath();
		ctx.moveTo(size, 0);
		ctx.lineTo(-size * 0.7, size * 0.6);
		ctx.lineTo(-size * 0.35, 0);
		ctx.lineTo(-size * 0.7, -size * 0.6);
		ctx.closePath();
		ctx.fillStyle = '#e8222b';
		ctx.strokeStyle = '#fff';
		ctx.lineWidth = 1.5;
		ctx.fill();
		ctx.stroke();
		ctx.restore();

		// Scrollbar showing where this window sits in the whole document.
		const total = this.grid.height;
		if (total > height * scale) {
			const barTop = (top / total) * height;
			const barHeight = Math.max(8, ((height * scale) / total) * height);
			ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
			ctx.fillRect(width - 4, barTop, 3, barHeight);
		}
		return view;
	}
}
