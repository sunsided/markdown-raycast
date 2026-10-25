import { describe, expect, it } from 'vitest';
import { DEFAULT_LAYOUT, layoutMarkdown, type Measure, type TextOp } from './layout';
import { Material } from './materials';

/** Monospace stand-in for canvas text metrics. */
const measure: Measure = (text, font) => text.length * font.size * 0.5;

const texts = (md: string, opts = DEFAULT_LAYOUT) =>
	layoutMarkdown(md, measure, opts).ops.filter((op): op is TextOp => op.kind === 'text');

describe('layoutMarkdown', () => {
	it('records headings as sections with their material and size', () => {
		const layout = layoutMarkdown('# Title\n\nbody\n\n## Sub', measure);
		expect(layout.sections.map((s) => [s.title, s.depth])).toEqual([
			['Title', 1],
			['Sub', 2]
		]);
		const [title] = texts('# Title');
		expect(title.material).toBe(Material.Heading1);
		expect(title.font.size).toBe(DEFAULT_LAYOUT.headingSizes[0]);
		expect(title.font.bold).toBe(true);
	});

	it('keeps sections in document order with increasing y', () => {
		const { sections } = layoutMarkdown('# A\n\ntext\n\n## B\n\nmore\n\n### C', measure);
		expect(sections.map((s) => s.y)).toEqual([...sections.map((s) => s.y)].sort((a, b) => a - b));
	});

	it('styles inline strong, emphasis, code and links', () => {
		const ops = texts('plain **bold** *em* `code` [link](https://x.y)');
		const byText = Object.fromEntries(ops.map((op) => [op.text, op.material]));
		expect(byText).toMatchObject({
			plain: Material.Text,
			bold: Material.Strong,
			em: Material.Emphasis,
			code: Material.Code,
			link: Material.Link
		});
	});

	it('merges consecutive words of one style into a single op', () => {
		expect(texts('one two three').map((op) => op.text)).toEqual(['one two three']);
	});

	it('wraps paragraphs onto new lines within the content width', () => {
		const opts = { ...DEFAULT_LAYOUT, width: 200, margin: 10 };
		const ops = texts('aaaa bbbb cccc dddd eeee ffff gggg hhhh', opts);
		expect(ops.length).toBeGreaterThan(1);
		for (const op of ops) expect(op.x + op.width).toBeLessThanOrEqual(opts.width - opts.margin);
		const lines = new Set(ops.map((op) => op.y));
		expect(lines.size).toBe(ops.length);
	});

	it('leaves a corridor between consecutive lines', () => {
		const opts = { ...DEFAULT_LAYOUT, width: 80, margin: 10 };
		const [a, b] = texts('aaaa bbbb', opts);
		expect(b.y - a.y).toBeCloseTo(opts.bodySize * opts.lineHeight);
	});

	it('draws bullets, task boxes and numbers for lists', () => {
		const { ops } = layoutMarkdown('- a\n- b\n\n1. x\n2. y\n\n- [x] done', measure);
		const bullets = ops.filter((op) => op.material === Material.Bullet);
		expect(bullets.filter((op) => op.kind === 'rect').length).toBe(2 + 5);
		expect(bullets.filter((op): op is TextOp => op.kind === 'text').map((op) => op.text)).toEqual([
			'1.',
			'2.'
		]);
	});

	it('renders code blocks line by line in monospace with a side bar', () => {
		const { ops } = layoutMarkdown('```\nfirst\n\nsecond\n```', measure);
		const code = ops.filter((op): op is TextOp => op.kind === 'text');
		expect(code.map((op) => op.text)).toEqual(['first', 'second']);
		expect(code.every((op) => op.font.mono && op.material === Material.Code)).toBe(true);
		expect(ops.some((op) => op.kind === 'rect' && op.material === Material.Code)).toBe(true);
	});

	it('turns a thematic break into a rule spanning the content width', () => {
		const { ops } = layoutMarkdown('a\n\n---\n\nb', measure);
		const rule = ops.find((op) => op.kind === 'rect' && op.material === Material.Rule);
		expect(rule).toMatchObject({
			x: DEFAULT_LAYOUT.margin,
			width: DEFAULT_LAYOUT.width - 2 * DEFAULT_LAYOUT.margin
		});
	});

	it('lays out table cells in aligned columns', () => {
		const ops = texts('| a | b |\n|---|---|\n| 1 | 2 |');
		const [a, b, one, two] = ops;
		expect(a.x).toBe(one.x);
		expect(b.x).toBe(two.x);
		expect(a.material).toBe(Material.Strong);
		expect(one.y).toBeGreaterThan(a.y);
	});

	it('decodes entities and strips inline html', () => {
		expect(texts('fish &amp; chips <b>now</b>').map((op) => op.text)).toEqual(['fish & chips now']);
	});

	it('grows the page to fit wide content and adds bottom margin', () => {
		const layout = layoutMarkdown('```\n' + 'x'.repeat(200) + '\n```', measure);
		expect(layout.width).toBeGreaterThan(DEFAULT_LAYOUT.width);
		const last = layout.ops.at(-1)!;
		expect(layout.height).toBeGreaterThan(last.y + DEFAULT_LAYOUT.margin - 1);
	});
});
