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
