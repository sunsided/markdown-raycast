/**
 * Framework-agnostic engine: Markdown layout, rasterization into a wall grid,
 * DDA raycasting, movement, and the canvas renderer and minimap.
 * For a ready-made UI see the `./svelte` and `./vanilla` entry points.
 */
export {
	Controls,
	GAME_KEYS,
	MOUSE_SENSITIVITY,
	RUN_FACTOR,
	TURN_SPEED,
	WALK_SPEED
} from './engine/controls.js';
export { cellAt, createGrid, floorAt, gridFromRows, isSolid, type Grid } from './engine/grid.js';
export {
	DEFAULT_LAYOUT,
	fontString,
	layoutMarkdown,
	type DrawOp,
	type FontSpec,
	type LayoutOptions,
	type Measure,
	type PageLayout,
	type RectOp,
	type Region,
	type Section,
	type TextOp
} from './engine/layout.js';
export {
	BASE_WALL_HEIGHT,
	FLOOR_KIND_COUNT,
	FLOOR_PALETTE,
	FloorKind,
	MATERIAL_COUNT,
	MAX_WALL_HEIGHT,
	Material,
	PALETTE,
	PAPER,
	WALL_HEIGHTS,
	headingMaterial,
	type Rgb
} from './engine/materials.js';
export { Minimap, type MinimapView } from './engine/minimap.js';
export { PLAYER_RADIUS, collides, findFreeSpot, move, type Player } from './engine/player.js';
export { canvasMeasure, rasterize } from './engine/rasterize.js';
export { castRay, emptyHit, traceRay, type RayHit } from './engine/raycast.js';
export { FOV, MAX_DISTANCE, Renderer, WALL_HEIGHT } from './engine/renderer.js';
export { buildWorld, sectionAt, type World } from './engine/world.js';
