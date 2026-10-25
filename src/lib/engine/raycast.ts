import { cellAt, type Grid } from './grid.js';
import { Material, WALL_HEIGHTS } from './materials.js';

export interface RayHit {
	/** Distance along the camera direction (fisheye-corrected when the ray is `dir + plane * t`). */
	distance: number;
	/** 0 when a vertical (x) cell boundary was crossed, 1 for a horizontal (y) one. */
	side: 0 | 1;
	material: Material;
	/** Where along the wall face the ray landed, in [0, 1). */
	wallX: number;
	cellX: number;
	cellY: number;
}

export function emptyHit(): RayHit {
	return { distance: 0, side: 0, material: Material.Empty, wallX: 0, cellX: 0, cellY: 0 };
}

/**
 * Walks a ray through the grid by digital differential analysis and reports, nearest
 * first, every wall face that could be visible: the first wall after open floor, and
 * any wall taller than the one directly in front of it (a tall heading behind short
 * text still shows above it). `visit` receives the hit in `out` and returns whether
 * to keep going. The walk ends at the page edge or beyond `maxDistance`.
 */
export function traceRay(
	grid: Grid,
	px: number,
	py: number,
	dx: number,
	dy: number,
	maxDistance: number,
	out: RayHit,
	visit: (hit: RayHit) => boolean
): void {
	let mapX = Math.floor(px);
	let mapY = Math.floor(py);
	const deltaX = dx === 0 ? Infinity : Math.abs(1 / dx);
	const deltaY = dy === 0 ? Infinity : Math.abs(1 / dy);
	const stepX = dx < 0 ? -1 : 1;
	const stepY = dy < 0 ? -1 : 1;
	let sideX = (dx < 0 ? px - mapX : mapX + 1 - px) * deltaX;
	let sideY = (dy < 0 ? py - mapY : mapY + 1 - py) * deltaY;
	let previous: Material = Material.Empty;

	for (;;) {
		let side: 0 | 1;
		let distance: number;
		if (sideX < sideY) {
			distance = sideX;
			sideX += deltaX;
			mapX += stepX;
			side = 0;
		} else {
			distance = sideY;
			sideY += deltaY;
			mapY += stepY;
			side = 1;
		}
		if (distance > maxDistance) return;

		const material = cellAt(grid, mapX, mapY);
		if (
			material !== Material.Empty &&
			(previous === Material.Empty || WALL_HEIGHTS[material] > WALL_HEIGHTS[previous])
		) {
			const along = side === 0 ? py + distance * dy : px + distance * dx;
			out.distance = distance;
			out.side = side;
			out.material = material;
			out.wallX = along - Math.floor(along);
			out.cellX = mapX;
			out.cellY = mapY;
			if (!visit(out) || material === Material.Edge) return;
		}
		// Past the page everything is edge; nothing further can show.
		if (material === Material.Edge) return;
		previous = material;
	}
}

/**
 * Finds the nearest wall along the ray. Writes into `out` and returns whether a
 * wall was hit within `maxDistance`; on a miss `out.distance` is `maxDistance`.
 */
export function castRay(
	grid: Grid,
	px: number,
	py: number,
	dx: number,
	dy: number,
	maxDistance: number,
	out: RayHit
): boolean {
	let found = false;
	traceRay(grid, px, py, dx, dy, maxDistance, out, () => {
		found = true;
		return false;
	});
	if (!found) {
		out.distance = maxDistance;
		out.material = Material.Empty;
	}
	return found;
}
