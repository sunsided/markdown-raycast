import { createGrid, stampRegions, type Grid } from './grid.js';
import { fontString, type FontSpec, type Measure, type PageLayout } from './layout.js';

/** Rows rendered per canvas pass; keeps us below browser canvas size limits for long documents. */
const CHUNK_ROWS = 2048;
/** Minimum glyph coverage (alpha, 0–255) for a cell to become a wall. */
const INK_THRESHOLD = 110;

type Canvas2D = OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;

function createContext(width: number, height: number): Canvas2D {
	if (typeof OffscreenCanvas !== 'undefined') {
		const ctx = new OffscreenCanvas(width, height).getContext('2d', { willReadFrequently: true });
		if (ctx) return ctx;
	}
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext('2d', { willReadFrequently: true });
	if (!ctx) throw new Error('2D canvas is not available');
	return ctx;
}

/** A `Measure` backed by the browser's text metrics, matching what `rasterize` draws. */
export function canvasMeasure(): Measure {
	const ctx = createContext(1, 1);
	const cache = new Map<string, number>();
	return (text: string, font: FontSpec) => {
		const key = fontString(font);
		const cacheKey = `${key}\u0000${text}`;
		let width = cache.get(cacheKey);
		if (width === undefined) {
			ctx.font = key;
			width = ctx.measureText(text).width;
			cache.set(cacheKey, width);
		}
		return width;
	};
}

/**
 * Draws the page and turns every sufficiently inked pixel into a wall cell
 * carrying the material of the op that drew it.
 */
export function rasterize(layout: PageLayout): Grid {
	const grid = createGrid(layout.width, layout.height);
	stampRegions(grid, layout.regions);
	const ctx = createContext(layout.width, Math.min(CHUNK_ROWS, layout.height));
	ctx.textBaseline = 'top';
	ctx.fillStyle = '#000';

	for (let top = 0; top < layout.height; top += CHUNK_ROWS) {
		const rows = Math.min(CHUNK_ROWS, layout.height - top);
		const visible = layout.ops.filter((op) => {
			const height = op.kind === 'text' ? op.font.size * 1.4 : op.height;
			return op.y < top + rows && op.y + height > top;
		});
		if (visible.length === 0) continue;

		ctx.clearRect(0, 0, layout.width, CHUNK_ROWS);
		for (const op of visible) {
			if (op.kind === 'text') {
				ctx.font = fontString(op.font);
				ctx.fillText(op.text, op.x, op.y - top);
			} else {
				ctx.fillRect(op.x, op.y - top, op.width, op.height);
			}
		}
		const alpha = ctx.getImageData(0, 0, layout.width, rows).data;

		// Assign materials per op bounding box; the first op to claim a cell wins.
		for (const op of visible) {
			const slack = op.kind === 'text' ? op.font.size * 0.3 : 0;
			const height = op.kind === 'text' ? op.font.size * 1.4 : op.height;
			const x0 = Math.max(0, Math.floor(op.x - slack));
			const x1 = Math.min(layout.width, Math.ceil(op.x + op.width + slack));
			const y0 = Math.max(top, Math.floor(op.y - slack));
			const y1 = Math.min(top + rows, Math.ceil(op.y + height));
			for (let y = y0; y < y1; y++) {
				const row = (y - top) * layout.width;
				for (let x = x0; x < x1; x++) {
					const cell = y * layout.width + x;
					if (grid.cells[cell] === 0 && alpha[(row + x) * 4 + 3] >= INK_THRESHOLD) {
						grid.cells[cell] = op.material;
					}
				}
			}
		}
	}
	return grid;
}
