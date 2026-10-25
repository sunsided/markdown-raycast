import { describe, expect, it } from 'vitest';
import { gridFromRows } from './grid';
import { Material } from './materials';
import { castRay, emptyHit } from './raycast';

const grid = gridFromRows([
	'..........', //
	'..........',
	'.....#....',
	'..........'
]);

describe('castRay', () => {
	it('hits the first wall along the ray', () => {
		const hit = emptyHit();
		expect(castRay(grid, 0.5, 2.5, 1, 0, 100, hit)).toBe(true);
		expect(hit).toMatchObject({ cellX: 5, cellY: 2, side: 0, material: Material.Text });
		expect(hit.distance).toBeCloseTo(4.5);
		expect(hit.wallX).toBeCloseTo(0.5);
	});

	it('reports horizontal faces as side 1', () => {
		const hit = emptyHit();
		expect(castRay(grid, 5.25, 0.5, 0, 1, 100, hit)).toBe(true);
		expect(hit.side).toBe(1);
		expect(hit.distance).toBeCloseTo(1.5);
		expect(hit.wallX).toBeCloseTo(0.25);
	});

	it('treats everything outside the page as an edge wall', () => {
		const hit = emptyHit();
		expect(castRay(grid, 0.5, 0.5, -1, 0, 100, hit)).toBe(true);
		expect(hit.material).toBe(Material.Edge);
		expect(hit.distance).toBeCloseTo(0.5);
	});

	it('gives up beyond the maximum distance', () => {
		const hit = emptyHit();
		expect(castRay(grid, 0.5, 2.5, 1, 0, 3, hit)).toBe(false);
		expect(hit.distance).toBe(3);
	});

	it('returns the perpendicular distance for off-axis rays', () => {
		// dir (1, 0) plus a camera-plane offset of (0, 0.5): perpendicular distance stays on x.
		const hit = emptyHit();
		castRay(gridFromRows(['...#', '...#', '...#', '...#']), 0.5, 1.5, 1, 0.5, 100, hit);
		expect(hit.cellX).toBe(3);
		expect(hit.distance).toBeCloseTo(2.5);
	});
});
