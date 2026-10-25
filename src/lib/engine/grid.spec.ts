import { describe, expect, it } from 'vitest';
import { createGrid, floorAt, stampRegions } from './grid.js';
import { DEFAULT_LAYOUT, layoutMarkdown, type Measure } from './layout.js';
import { FloorKind } from './materials.js';

const measure: Measure = (text, font) => text.length * font.size * 0.5;

describe('stampRegions', () => {
	it('tints the cells inside each region and clips to the grid', () => {
		const grid = createGrid(10, 10);
		stampRegions(grid, [{ kind: FloorKind.Code, x: 8, y: -2, width: 5, height: 4 }]);
		expect(floorAt(grid, 9, 1)).toBe(FloorKind.Code);
		expect(floorAt(grid, 7, 1)).toBe(FloorKind.Paper);
		expect(floorAt(grid, 9, 2)).toBe(FloorKind.Paper);
	});

	it('keeps the first tint where regions overlap', () => {
		const grid = createGrid(10, 10);
		stampRegions(grid, [
			{ kind: FloorKind.Code, x: 2, y: 2, width: 2, height: 2 },
			{ kind: FloorKind.Quote, x: 0, y: 0, width: 10, height: 10 }
		]);
		expect(floorAt(grid, 3, 3)).toBe(FloorKind.Code);
		expect(floorAt(grid, 6, 6)).toBe(FloorKind.Quote);
	});

	it('keeps a code block tinted as code inside a quote', () => {
		const layout = layoutMarkdown('> quoted\n>\n> ```\n> code\n> ```\n>\n> more', measure);
		const grid = createGrid(layout.width, layout.height);
		stampRegions(grid, layout.regions);
		const code = layout.regions.find((r) => r.kind === FloorKind.Code)!;
		const quote = layout.regions.find((r) => r.kind === FloorKind.Quote)!;
		expect(floorAt(grid, Math.floor(code.x + 4), Math.floor(code.y + 2))).toBe(FloorKind.Code);
		expect(floorAt(grid, Math.floor(quote.x + 2), Math.floor(quote.y + 2))).toBe(FloorKind.Quote);
		expect(layout.width).toBeGreaterThanOrEqual(DEFAULT_LAYOUT.width);
	});
});
