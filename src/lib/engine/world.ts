import type { Grid } from './grid';
import { layoutMarkdown, type Measure, type PageLayout, type Section } from './layout';
import { findFreeSpot, type Player } from './player';
import { rasterize } from './rasterize';

export interface World {
	layout: PageLayout;
	grid: Grid;
	spawn: Player;
}

/** Lays out, rasterizes and picks a spawn point in the top-left margin, looking at the title. */
export function buildWorld(markdown: string, measure: Measure): World {
	const layout = layoutMarkdown(markdown, measure);
	const grid = rasterize(layout);
	const spot = findFreeSpot(grid, layout.margin * 0.4, layout.margin * 0.5) ?? { x: 1.5, y: 1.5 };
	return { layout, grid, spawn: { ...spot, angle: 0.3 } };
}

/** The heading whose section contains page row `y`, if any. */
export function sectionAt(sections: readonly Section[], y: number): Section | undefined {
	let current: Section | undefined;
	for (const section of sections) {
		if (section.y > y) break;
		current = section;
	}
	return current;
}
