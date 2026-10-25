import type { Grid } from './grid';
import { move, type Player } from './player';

export const WALK_SPEED = 16; // cells per second
export const RUN_FACTOR = 2.2;
export const TURN_SPEED = 2.4; // radians per second
export const MOUSE_SENSITIVITY = 0.0025; // radians per pixel

const FORWARD = ['KeyW', 'ArrowUp'];
const BACKWARD = ['KeyS', 'ArrowDown'];
const STRAFE_LEFT = ['KeyA'];
const STRAFE_RIGHT = ['KeyD'];
const TURN_LEFT = ['ArrowLeft', 'KeyQ'];
const TURN_RIGHT = ['ArrowRight', 'KeyE'];
const RUN = ['ShiftLeft', 'ShiftRight'];

export const GAME_KEYS = new Set([
	...FORWARD,
	...BACKWARD,
	...STRAFE_LEFT,
	...STRAFE_RIGHT,
	...TURN_LEFT,
	...TURN_RIGHT
]);

/** Keyboard state plus accumulated mouse look, applied once per frame. */
export class Controls {
	private readonly down = new Set<string>();
	private mouseTurn = 0;

	press(code: string) {
		this.down.add(code);
	}

	release(code: string) {
		this.down.delete(code);
	}

	clear() {
		this.down.clear();
		this.mouseTurn = 0;
	}

	look(movementX: number) {
		this.mouseTurn += movementX * MOUSE_SENSITIVITY;
	}

	private any(codes: readonly string[]) {
		return codes.some((c) => this.down.has(c));
	}

	/** Advances the player by `dt` seconds. Returns whether anything moved. */
	update(grid: Grid, player: Player, dt: number): boolean {
		const turn = (this.any(TURN_RIGHT) ? 1 : 0) - (this.any(TURN_LEFT) ? 1 : 0);
		const forward = (this.any(FORWARD) ? 1 : 0) - (this.any(BACKWARD) ? 1 : 0);
		const strafe = (this.any(STRAFE_RIGHT) ? 1 : 0) - (this.any(STRAFE_LEFT) ? 1 : 0);
		const mouseTurn = this.mouseTurn;
		this.mouseTurn = 0;
		if (turn === 0 && mouseTurn === 0 && forward === 0 && strafe === 0) return false;

		// Keep the angle bounded so long sessions don't erode trig precision.
		const TAU = Math.PI * 2;
		player.angle = (((player.angle + turn * TURN_SPEED * dt + mouseTurn) % TAU) + TAU) % TAU;
		const speed = WALK_SPEED * (this.any(RUN) ? RUN_FACTOR : 1) * dt;
		const norm = forward !== 0 && strafe !== 0 ? Math.SQRT1_2 : 1;
		const cos = Math.cos(player.angle);
		const sin = Math.sin(player.angle);
		// Strafing right is +90°, which points to +y when facing +x.
		const dx = (cos * forward - sin * strafe) * speed * norm;
		const dy = (sin * forward + cos * strafe) * speed * norm;
		move(grid, player, dx, dy);
		return true;
	}
}
