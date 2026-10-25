import { describe, expect, it } from 'vitest';
import { gridFromRows } from './grid.js';
import { Material } from './materials.js';
import { castRay, emptyHit, traceRay, type RayHit } from './raycast.js';

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

describe('traceRay', () => {
	const collect = (rows: string[], max = 100) => {
		const hits: Pick<RayHit, 'cellX' | 'material'>[] = [];
		traceRay(gridFromRows(rows), 0.5, 0.5, 1, 0, max, emptyHit(), (hit) => {
			hits.push({ cellX: hit.cellX, material: hit.material });
			return true;
		});
		return hits;
	};

	it('reports a taller heading behind shorter text', () => {
		expect(collect(['..##..11..'])).toEqual([
			{ cellX: 2, material: Material.Text },
			{ cellX: 6, material: Material.Heading1 },
			{ cellX: 10, material: Material.Edge }
		]);
	});

	it('skips cells hidden behind a wall of the same or greater height', () => {
		// The second text cell and the text after the H2 are fully occluded.
		const hits = collect(['.##2#.#...']);
		expect(hits.map((h) => h.cellX)).toEqual([1, 3, 6, 10]);
	});

	it('stops when the visitor says so', () => {
		const hits: number[] = [];
		traceRay(gridFromRows(['..#..1....']), 0.5, 0.5, 1, 0, 100, emptyHit(), (hit) => {
			hits.push(hit.cellX);
			return false;
		});
		expect(hits).toEqual([2]);
	});

	it('ends at the page edge and at the maximum distance', () => {
		expect(collect(['....']).map((h) => h.material)).toEqual([Material.Edge]);
		expect(collect(['..........#'], 5)).toEqual([]);
	});
});
