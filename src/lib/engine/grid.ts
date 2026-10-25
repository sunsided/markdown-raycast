import { FloorKind, Material, headingMaterial } from './materials.js';

/** The walkable world: one material id per cell, row-major, plus what the floor belongs to. */
export interface Grid {
	readonly width: number;
	readonly height: number;
	readonly cells: Uint8Array;
	/** Floor kind per cell (see `FloorKind`), same layout as `cells`. */
	readonly floor: Uint8Array;
}

export function createGrid(width: number, height: number): Grid {
	return {
		width,
		height,
		cells: new Uint8Array(width * height),
		floor: new Uint8Array(width * height)
	};
}

/**
 * Builds a grid from ASCII art, handy for tests: `1`–`6` are heading walls of that level,
 * any other character except space and `.` is a text wall.
 */
export function gridFromRows(rows: readonly string[]): Grid {
	const grid = createGrid(Math.max(...rows.map((r) => r.length)), rows.length);
	rows.forEach((row, y) => {
		for (let x = 0; x < row.length; x++) {
			const c = row[x];
			if (c === ' ' || c === '.') continue;
			grid.cells[y * grid.width + x] = c >= '1' && c <= '6' ? headingMaterial(+c) : Material.Text;
		}
	});
	return grid;
}

export function cellAt(grid: Grid, x: number, y: number): Material {
	if (x < 0 || y < 0 || x >= grid.width || y >= grid.height) return Material.Edge;
	return grid.cells[y * grid.width + x] as Material;
}

export function floorAt(grid: Grid, x: number, y: number): FloorKind {
	if (x < 0 || y < 0 || x >= grid.width || y >= grid.height) return FloorKind.Paper;
	return grid.floor[y * grid.width + x] as FloorKind;
}

export function isSolid(grid: Grid, x: number, y: number): boolean {
	return cellAt(grid, Math.floor(x), Math.floor(y)) !== Material.Empty;
}
