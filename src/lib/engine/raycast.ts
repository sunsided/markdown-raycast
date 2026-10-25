import { cellAt, type Grid } from './grid';
import { Material } from './materials';

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
 * Digital differential analysis through the grid. Writes into `out` and returns
 * whether a wall was hit within `maxDistance`; on a miss `out.distance` is `maxDistance`.
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
	let mapX = Math.floor(px);
	let mapY = Math.floor(py);
	const deltaX = dx === 0 ? Infinity : Math.abs(1 / dx);
	const deltaY = dy === 0 ? Infinity : Math.abs(1 / dy);
	const stepX = dx < 0 ? -1 : 1;
	const stepY = dy < 0 ? -1 : 1;
	let sideX = (dx < 0 ? px - mapX : mapX + 1 - px) * deltaX;
	let sideY = (dy < 0 ? py - mapY : mapY + 1 - py) * deltaY;

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
		if (distance > maxDistance) {
			out.distance = maxDistance;
			out.material = Material.Empty;
			return false;
		}
		const material = cellAt(grid, mapX, mapY);
		if (material !== Material.Empty) {
			const along = side === 0 ? py + distance * dy : px + distance * dx;
			out.distance = distance;
			out.side = side;
			out.material = material;
			out.wallX = along - Math.floor(along);
			out.cellX = mapX;
			out.cellY = mapY;
			return true;
		}
	}
}
