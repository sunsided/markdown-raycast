import { Lexer, type Token, type Tokens } from 'marked';
import { Material, headingMaterial } from './materials';

/**
 * Lays a Markdown document out like a rendered page. The result is a list of
 * draw operations in page coordinates where one unit is one grid cell; the
 * rasterizer later turns every inked pixel into a wall.
 */

export interface FontSpec {
	size: number;
	bold: boolean;
	italic: boolean;
	mono: boolean;
}

export interface TextOp {
	kind: 'text';
	x: number;
	/** Top of the line box; text is drawn with `textBaseline = 'top'`. */
	y: number;
	width: number;
	text: string;
	font: FontSpec;
	material: Material;
}

export interface RectOp {
	kind: 'rect';
	x: number;
	y: number;
	width: number;
	height: number;
	material: Material;
}

export type DrawOp = TextOp | RectOp;

export interface Section {
	title: string;
	depth: number;
	/** Top of the heading in page coordinates. */
	y: number;
}

export interface PageLayout {
	width: number;
	height: number;
	margin: number;
	ops: DrawOp[];
	sections: Section[];
}

/** Returns the advance width of `text` in page units. */
export type Measure = (text: string, font: FontSpec) => number;

export interface LayoutOptions {
	/** Page width including margins. */
	width: number;
	margin: number;
	bodySize: number;
	codeSize: number;
	/** Line advance as a multiple of the font size; the gap becomes the corridor. */
	lineHeight: number;
	headingSizes: readonly number[];
}

export const DEFAULT_LAYOUT: LayoutOptions = {
	width: 720,
	margin: 48,
	bodySize: 18,
	codeSize: 16,
	lineHeight: 2.2,
	headingSizes: [44, 34, 28, 24, 20, 18]
};

const SANS = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

export function fontString(font: FontSpec): string {
	return `${font.italic ? 'italic ' : ''}${font.bold ? 'bold ' : ''}${font.size}px ${font.mono ? MONO : SANS}`;
}

interface Style {
	font: FontSpec;
	material: Material;
}

interface Run {
	text: string;
	style: Style;
}

interface Box {
	x: number;
	width: number;
	style: Style;
}

const ENTITIES: Record<string, string> = {
	'&amp;': '&',
	'&lt;': '<',
	'&gt;': '>',
	'&quot;': '"',
	'&#39;': "'",
	'&nbsp;': ' '
};

function decodeEntities(text: string): string {
	return text.replace(/&(?:amp|lt|gt|quot|#39|nbsp);/g, (m) => ENTITIES[m]);
}

function stripTags(html: string): string {
	return decodeEntities(html.replace(/<[^>]*>/g, ''));
}

/** Plain text of a token tree, used for section titles. */
function plainText(tokens: Token[] | undefined): string {
	if (!tokens) return '';
	return tokens
		.map((t) => ('tokens' in t && t.tokens ? plainText(t.tokens) : 'text' in t ? t.text : ''))
		.join('');
}

/** Inline styles inherit from the block; plain text keeps the block's material. */
function emphasize(base: Style, patch: Partial<FontSpec>, material: Material): Style {
	return {
		font: { ...base.font, ...patch },
		material: base.material === Material.Text ? material : base.material
	};
}

function collectRuns(tokens: Token[], style: Style, out: Run[] = []): Run[] {
	for (const token of tokens) {
		switch (token.type) {
			case 'strong':
				collectRuns(token.tokens ?? [], emphasize(style, { bold: true }, Material.Strong), out);
				break;
			case 'em':
				collectRuns(token.tokens ?? [], emphasize(style, { italic: true }, Material.Emphasis), out);
				break;
			case 'codespan':
				out.push({
					text: decodeEntities(token.text),
					style: { font: { ...style.font, mono: true }, material: Material.Code }
				});
				break;
			case 'link':
				collectRuns(token.tokens ?? [], { font: style.font, material: Material.Link }, out);
				break;
			case 'image':
				out.push({
					text: `[${token.text || 'image'}]`,
					style: emphasize(style, { italic: true }, Material.Emphasis)
				});
				break;
			case 'br':
				out.push({ text: '\n', style });
				break;
			case 'html':
				out.push({ text: stripTags(token.text), style });
				break;
			case 'checkbox':
				break;
			default:
				if ('tokens' in token && token.tokens) collectRuns(token.tokens, style, out);
				else if ('text' in token) out.push({ text: decodeEntities(token.text), style });
		}
	}
	return out;
}

class PageBuilder {
	readonly ops: DrawOp[] = [];
	readonly sections: Section[] = [];
	y: number;
	maxX = 0;

	constructor(
		private readonly measure: Measure,
		private readonly opts: LayoutOptions
	) {
		this.y = opts.margin;
	}

	private font(size: number, patch: Partial<FontSpec> = {}): FontSpec {
		return { size, bold: false, italic: false, mono: false, ...patch };
	}

	private text(x: number, y: number, text: string, style: Style): number {
		const width = this.measure(text, style.font);
		this.ops.push({ kind: 'text', x, y, width, text, font: style.font, material: style.material });
		this.maxX = Math.max(this.maxX, x + width);
		return width;
	}

	private rect(x: number, y: number, width: number, height: number, material: Material) {
		this.ops.push({ kind: 'rect', x, y, width, height, material });
		this.maxX = Math.max(this.maxX, x + width);
	}

	/** Greedy word wrap of inline runs into lines starting at the current `y`. */
	private flow(runs: Run[], x0: number, width: number, size: number) {
		const advance = size * this.opts.lineHeight;
		let line: Box[] = [];
		let lineText: string[] = [];
		let x = x0;
		let pendingSpace = 0;

		const commit = () => {
			for (let i = 0; i < line.length; i++)
				this.text(line[i].x, this.y, lineText[i], line[i].style);
			line = [];
			lineText = [];
			x = x0;
			pendingSpace = 0;
			this.y += advance;
		};

		for (const run of runs) {
			for (const piece of run.text.split(/(\n|[ \t]+)/)) {
				if (piece === '') continue;
				if (piece === '\n') {
					commit();
				} else if (/^[ \t]+$/.test(piece)) {
					if (x > x0) pendingSpace = this.measure(' ', run.style.font);
				} else {
					const w = this.measure(piece, run.style.font);
					if (x > x0 && x + pendingSpace + w > x0 + width) commit();
					const start = x + pendingSpace;
					// Merge with the previous box when the style continues, so words stay one op.
					const last = line.at(-1);
					if (last && last.style === run.style) {
						lineText[lineText.length - 1] += ' '.repeat(pendingSpace > 0 ? 1 : 0) + piece;
						last.width = start + w - last.x;
					} else {
						line.push({ x: start, width: w, style: run.style });
						lineText.push(piece);
					}
					x = start + w;
					pendingSpace = 0;
				}
			}
		}
		if (line.length > 0) commit();
	}

	blocks(tokens: Token[], x: number, width: number, base: Style) {
		const { bodySize, codeSize, headingSizes, lineHeight } = this.opts;
		const gap = bodySize * 0.6;

		for (const token of tokens) {
			switch (token.type) {
				case 'heading': {
					const t = token as Tokens.Heading;
					const size = headingSizes[Math.min(t.depth, 6) - 1];
					const style = {
						font: this.font(size, { bold: true }),
						material: headingMaterial(t.depth)
					};
					this.y += size * 0.4;
					this.sections.push({ title: plainText(t.tokens).trim(), depth: t.depth, y: this.y });
					this.flow(collectRuns(t.tokens, style), x, width, size);
					break;
				}
				case 'paragraph':
				case 'text': {
					const t = token as Tokens.Paragraph | Tokens.Text;
					const runs = t.tokens ? collectRuns(t.tokens, base) : [{ text: t.text, style: base }];
					this.flow(runs, x, width, base.font.size);
					if (token.type === 'paragraph') this.y += gap;
					break;
				}
				case 'list':
					this.list(token as Tokens.List, x, width, base);
					this.y += gap;
					break;
				case 'code': {
					const t = token as Tokens.Code;
					const style = { font: this.font(codeSize, { mono: true }), material: Material.Code };
					const top = this.y;
					const advance = codeSize * lineHeight * 0.8;
					for (const line of t.text.replace(/\t/g, '    ').split('\n')) {
						if (line.trim()) this.text(x + 20, this.y, line, style);
						this.y += advance;
					}
					this.rect(x, top - codeSize * 0.4, 3, this.y - top, Material.Code);
					this.y += gap;
					break;
				}
				case 'blockquote': {
					const t = token as Tokens.Blockquote;
					const top = this.y;
					const style = { font: { ...base.font, italic: true }, material: Material.Quote };
					this.blocks(t.tokens, x + 24, width - 24, style);
					this.rect(x, top - bodySize * 0.4, 4, this.y - top - gap, Material.Quote);
					break;
				}
				case 'hr':
					this.y += bodySize * 0.6;
					this.rect(x, this.y, width, 3, Material.Rule);
					this.y += bodySize * 1.6;
					break;
				case 'table':
					this.table(token as Tokens.Table, x, base);
					this.y += gap;
					break;
				case 'html': {
					const text = stripTags((token as Tokens.HTML).text).trim();
					if (text) {
						this.flow([{ text, style: base }], x, width, base.font.size);
						this.y += gap;
					}
					break;
				}
				default:
					break;
			}
		}
	}

	private list(list: Tokens.List, x: number, width: number, base: Style) {
		const size = base.font.size;
		const indent = size * 1.8;
		const start = typeof list.start === 'number' ? list.start : 1;

		list.items.forEach((item, i) => {
			const top = this.y;
			if (item.task) {
				const s = size * 0.7;
				const bx = x + 2;
				const by = top + size * 0.2;
				this.rect(bx, by, s, 2, Material.Bullet);
				this.rect(bx, by + s - 2, s, 2, Material.Bullet);
				this.rect(bx, by, 2, s, Material.Bullet);
				this.rect(bx + s - 2, by, 2, s, Material.Bullet);
				if (item.checked) this.rect(bx + 5, by + 5, s - 10, s - 10, Material.Bullet);
			} else if (list.ordered) {
				this.text(x, top, `${start + i}.`, { font: base.font, material: Material.Bullet });
			} else {
				const s = Math.max(4, size * 0.35);
				this.rect(x + indent / 2 - s, top + size * 0.4, s, s, Material.Bullet);
			}
			this.blocks(item.tokens, x + indent, width - indent, base);
		});
	}

	private table(table: Tokens.Table, x: number, base: Style) {
		const size = base.font.size;
		const header = { font: { ...base.font, bold: true }, material: Material.Strong };
		const rows = [table.header, ...table.rows];
		const runs = rows.map((row, r) =>
			row.map((cell) => collectRuns(cell.tokens, r === 0 ? header : base))
		);
		const pad = size * 1.5;
		const widths = table.header.map((_, c) =>
			Math.max(
				...runs.map((row) =>
					(row[c] ?? []).reduce((w, run) => w + this.measure(run.text, run.style.font), 0)
				)
			)
		);
		const total = widths.reduce((a, b) => a + b + pad, 0) - pad;

		runs.forEach((row, r) => {
			let cx = x;
			row.forEach((cellRuns, c) => {
				let rx = cx;
				for (const run of cellRuns)
					if (run.text.trim()) rx += this.text(rx, this.y, run.text, run.style);
				cx += widths[c] + pad;
			});
			this.y += size * this.opts.lineHeight;
			if (r === 0) {
				this.rect(x, this.y - size * 0.7, total, 2, Material.Rule);
				this.y += size * 0.3;
			}
		});
	}
}

export function layoutMarkdown(
	markdown: string,
	measure: Measure,
	opts: LayoutOptions = DEFAULT_LAYOUT
): PageLayout {
	const builder = new PageBuilder(measure, opts);
	const body: Style = {
		font: { size: opts.bodySize, bold: false, italic: false, mono: false },
		material: Material.Text
	};
	const contentWidth = opts.width - 2 * opts.margin;
	builder.blocks(Lexer.lex(markdown, { gfm: true }), opts.margin, contentWidth, body);

	return {
		width: Math.ceil(Math.max(opts.width, builder.maxX + opts.margin)),
		height: Math.ceil(builder.y + opts.margin),
		margin: opts.margin,
		ops: builder.ops,
		sections: builder.sections
	};
}
