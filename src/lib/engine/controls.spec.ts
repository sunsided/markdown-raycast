import { describe, expect, it } from 'vitest';
import { Controls, MOUSE_SENSITIVITY, WALK_SPEED } from './controls';
import { gridFromRows } from './grid';

const open = gridFromRows(Array.from({ length: 40 }, () => '.'.repeat(40)));

describe('Controls', () => {
	it('walks forward along the facing direction', () => {
		const controls = new Controls();
		const p = { x: 10.5, y: 10.5, angle: 0 };
		controls.press('KeyW');
		expect(controls.update(open, p, 0.1)).toBe(true);
		expect(p.x).toBeCloseTo(10.5 + WALK_SPEED * 0.1);
		expect(p.y).toBeCloseTo(10.5);
	});

	it('strafes right towards +y when facing +x', () => {
		const controls = new Controls();
		const p = { x: 10.5, y: 10.5, angle: 0 };
		controls.press('KeyD');
		controls.update(open, p, 0.1);
		expect(p.y).toBeGreaterThan(10.5);
		expect(p.x).toBeCloseTo(10.5);
	});

	it('applies accumulated mouse look exactly once', () => {
		const controls = new Controls();
		const p = { x: 10.5, y: 10.5, angle: 0 };
		controls.look(100);
		controls.update(open, p, 0.016);
		expect(p.angle).toBeCloseTo(100 * MOUSE_SENSITIVITY);
		expect(controls.update(open, p, 0.016)).toBe(false);
	});

	it('stops when keys are released or cleared', () => {
		const controls = new Controls();
		const p = { x: 10.5, y: 10.5, angle: 0 };
		controls.press('KeyW');
		controls.release('KeyW');
		expect(controls.update(open, p, 0.1)).toBe(false);
		controls.press('KeyS');
		controls.clear();
		expect(controls.update(open, p, 0.1)).toBe(false);
	});

	it('keeps the angle within [0, 2π) in both turn directions', () => {
		const controls = new Controls();
		const p = { x: 10.5, y: 10.5, angle: 0 };
		controls.look(-100);
		controls.update(open, p, 0.016);
		expect(p.angle).toBeCloseTo(Math.PI * 2 - 100 * MOUSE_SENSITIVITY);
		controls.look((20 * Math.PI) / MOUSE_SENSITIVITY);
		controls.update(open, p, 0.016);
		expect(p.angle).toBeGreaterThanOrEqual(0);
		expect(p.angle).toBeLessThan(Math.PI * 2);
	});
});
