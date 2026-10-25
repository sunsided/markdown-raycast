import { describe, expect, it } from 'vitest';
import { sectionAt } from './world';

describe('sectionAt', () => {
	const sections = [
		{ title: 'A', depth: 1, y: 50 },
		{ title: 'B', depth: 2, y: 200 }
	];

	it('returns the last heading at or above the row', () => {
		expect(sectionAt(sections, 10)).toBeUndefined();
		expect(sectionAt(sections, 50)?.title).toBe('A');
		expect(sectionAt(sections, 199)?.title).toBe('A');
		expect(sectionAt(sections, 500)?.title).toBe('B');
	});
});
