import { isSolid, type Grid } from './grid';

export interface Player {
	x: number;
	y: number;
	/** Facing in radians; 0 looks along +x (east), positive turns towards +y (south). */
	angle: number;
}

export const PLAYER_RADIUS = 0.3;

/** Whether a square of half-size `r` centred on (x, y) overlaps any wall cell. */
export function collides(grid: Grid, x: number, y: number, r = PLAYER_RADIUS): boolean {
	const x0 = Math.floor(x - r);
	const x1 = Math.floor(x + r);
	const y0 = Math.floor(y - r);
	const y1 = Math.floor(y + r);
	for (let cy = y0; cy <= y1; cy++) {
		for (let cx = x0; cx <= x1; cx++) {
			if (isSolid(grid, cx, cy)) return true;
		}
	}
	return false;
}

/**
 * Moves the player by (dx, dy), resolving each axis separately so walls can be
 * slid along. Large steps are split so thin (one cell) walls are never tunnelled.
 */
export function move(grid: Grid, player: Player, dx: number, dy: number, r = PLAYER_RADIUS): void {
	const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 0.25));
	const sx = dx / steps;
	const sy = dy / steps;
	for (let i = 0; i < steps; i++) {
		if (!collides(grid, player.x + sx, player.y, r)) player.x += sx;
		if (!collides(grid, player.x, player.y + sy, r)) player.y += sy;
	}
}

/**
 * Finds a free spot near (x, y) by searching outward in growing rings.
 * Returns the cell centre, or `null` if the grid has no space at all.
 */
export function findFreeSpot(
	grid: Grid,
	x: number,
	y: number,
	r = PLAYER_RADIUS
): { x: number; y: number } | null {
	const cx = Math.floor(x);
	const cy = Math.floor(y);
	const maxRing = Math.max(grid.width, grid.height);
	for (let ring = 0; ring <= maxRing; ring++) {
		for (let oy = -ring; oy <= ring; oy++) {
			for (let ox = -ring; ox <= ring; ox++) {
				if (Math.max(Math.abs(ox), Math.abs(oy)) !== ring) continue;
				const px = cx + ox + 0.5;
				const py = cy + oy + 0.5;
				if (!collides(grid, px, py, r)) return { x: px, y: py };
			}
		}
	}
	return null;
}
