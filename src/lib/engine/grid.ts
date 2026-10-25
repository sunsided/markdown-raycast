import type { Region } from './layout.js';
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

/**
 * Tints the floor under each region. Only plain paper is written, so the first region
 * to claim a cell keeps it. Layout records nested blocks (a code block inside a quote)
 * before their container, so the inner, more specific tint wins.
 */
export function stampRegions(grid: Grid, regions: readonly Region[]): void {
	for (const region of regions) {
		const x0 = Math.max(0, Math.floor(region.x));
		const x1 = Math.min(grid.width, Math.ceil(region.x + region.width));
		const y0 = Math.max(0, Math.floor(region.y));
		const y1 = Math.min(grid.height, Math.ceil(region.y + region.height));
		for (let y = y0; y < y1; y++) {
			for (let i = y * grid.width + x0, end = y * grid.width + x1; i < end; i++) {
				if (grid.floor[i] === FloorKind.Paper) grid.floor[i] = region.kind;
			}
		}
	}
}

export function floorAt(grid: Grid, x: number, y: number): FloorKind {
	if (x < 0 || y < 0 || x >= grid.width || y >= grid.height) return FloorKind.Paper;
	return grid.floor[y * grid.width + x] as FloorKind;
}

export function isSolid(grid: Grid, x: number, y: number): boolean {
	return cellAt(grid, Math.floor(x), Math.floor(y)) !== Material.Empty;
}
