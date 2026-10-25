/** What a grid cell is made of. `Empty` is walkable floor, everything else is a wall. */
export const Material = {
	Empty: 0,
	Text: 1,
	Strong: 2,
	Emphasis: 3,
	Code: 4,
	Link: 5,
	Quote: 6,
	Rule: 7,
	Bullet: 8,
	Heading1: 9,
	Heading2: 10,
	Heading3: 11,
	Heading4: 12,
	Heading5: 13,
	Heading6: 14,
	/** Anything outside the page; rays and players treat it as solid. */
	Edge: 15
} as const;

export type Material = (typeof Material)[keyof typeof Material];

export const MATERIAL_COUNT = 16;

export type Rgb = readonly [number, number, number];

/** Ink colours per material, indexed by material id. */
export const PALETTE: readonly Rgb[] = [
	[243, 238, 224], // Empty: paper
	[29, 29, 39], // Text
	[13, 27, 74], // Strong
	[91, 42, 134], // Emphasis
	[15, 107, 92], // Code
	[31, 95, 191], // Link
	[107, 107, 107], // Quote
	[160, 133, 91], // Rule
	[192, 57, 43], // Bullet
	[179, 38, 30], // Heading1
	[196, 86, 26], // Heading2
	[184, 134, 11], // Heading3
	[46, 125, 50], // Heading4
	[0, 105, 92], // Heading5
	[69, 90, 100], // Heading6
	[141, 123, 90] // Edge
];

export const PAPER: Rgb = PALETTE[Material.Empty];

export function headingMaterial(depth: number): Material {
	return (Material.Heading1 + Math.min(Math.max(depth, 1), 6) - 1) as Material;
}

/** Height of an ordinary wall, in cells. Glyph strokes are 1–5 cells thick, so walls tower over you. */
export const BASE_WALL_HEIGHT = 10;

/** Wall height per material, indexed by material id: H1 headings are huge, H2 large. */
export const WALL_HEIGHTS: readonly number[] = Array.from({ length: MATERIAL_COUNT }, (_, m) =>
	m === Material.Heading1 ? 36 : m === Material.Heading2 ? 20 : BASE_WALL_HEIGHT
);

export const MAX_WALL_HEIGHT = Math.max(...WALL_HEIGHTS);

/** What the floor under a walkable cell belongs to; tints code and quote regions. */
export const FloorKind = {
	Paper: 0,
	Code: 1,
	Quote: 2
} as const;

export type FloorKind = (typeof FloorKind)[keyof typeof FloorKind];

export const FLOOR_KIND_COUNT = 3;

/** Floor colours per floor kind, indexed by kind id. */
export const FLOOR_PALETTE: readonly Rgb[] = [
	PALETTE[Material.Empty], // Paper
	[218, 233, 226], // Code: a cool teal wash, like a code block background
	[229, 224, 236] // Quote: a soft lavender-grey
];
