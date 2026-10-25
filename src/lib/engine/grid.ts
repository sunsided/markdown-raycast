import { Material } from './materials';

/** The walkable world: one material id per cell, row-major. */
export interface Grid {
	readonly width: number;
	readonly height: number;
	readonly cells: Uint8Array;
}

export function createGrid(width: number, height: number): Grid {
	return { width, height, cells: new Uint8Array(width * height) };
}

/** Builds a grid from ASCII art: `#` (or any non-space, non-`.`) is a text wall. Handy for tests. */
export function gridFromRows(rows: readonly string[]): Grid {
	const grid = createGrid(Math.max(...rows.map((r) => r.length)), rows.length);
	rows.forEach((row, y) => {
		for (let x = 0; x < row.length; x++) {
			if (row[x] !== ' ' && row[x] !== '.') grid.cells[y * grid.width + x] = Material.Text;
		}
	});
	return grid;
}

export function cellAt(grid: Grid, x: number, y: number): Material {
	if (x < 0 || y < 0 || x >= grid.width || y >= grid.height) return Material.Edge;
	return grid.cells[y * grid.width + x] as Material;
}

export function isSolid(grid: Grid, x: number, y: number): boolean {
	return cellAt(grid, Math.floor(x), Math.floor(y)) !== Material.Empty;
}
