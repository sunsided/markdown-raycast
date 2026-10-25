import { describe, expect, it } from 'vitest';
import { gridFromRows } from './grid';
import { collides, findFreeSpot, move, PLAYER_RADIUS } from './player';

const room = gridFromRows([
	'#######', //
	'#.....#',
	'#..#..#',
	'#.....#',
	'#######'
]);

describe('player movement', () => {
	it('detects overlap with walls within the player radius', () => {
		expect(collides(room, 1.5, 1.5)).toBe(false);
		expect(collides(room, 1.2, 1.5)).toBe(true);
		expect(collides(room, 3.5, 2.5)).toBe(true);
	});

	it('moves freely through open space', () => {
		const p = { x: 1.5, y: 1.5, angle: 0 };
		move(room, p, 1, 1);
		expect(p).toMatchObject({ x: 2.5, y: 2.5 });
	});

	it('stops at walls but slides along them', () => {
		const p = { x: 1.5, y: 1.5, angle: 0 };
		move(room, p, 0.5, -1);
		expect(p.y).toBeCloseTo(1.5);
		expect(p.x).toBeCloseTo(2);
		expect(p.y - PLAYER_RADIUS).toBeGreaterThanOrEqual(1);
	});

	it('does not tunnel through one-cell walls on large steps', () => {
		const p = { x: 2.5, y: 2.5, angle: 0 };
		move(room, p, 3, 0);
		expect(p.x).toBeLessThan(3);
	});

	it('finds the nearest free spot when the start is blocked', () => {
		expect(findFreeSpot(room, 3.5, 2.5)).not.toBeNull();
		const spot = findFreeSpot(room, 0, 0)!;
		expect(collides(room, spot.x, spot.y)).toBe(false);
		expect(findFreeSpot(gridFromRows(['##', '##']), 0, 0)).toBeNull();
	});
});
