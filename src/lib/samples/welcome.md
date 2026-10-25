# Walk the Page

Welcome to **markdown-raycast**. Every letter on this page is a _wall_, and the gaps
between the lines are the corridors you are walking through right now.

## How it works

1. The Markdown is parsed and laid out like a rendered page.
2. Each glyph is drawn onto a canvas, one pixel per world cell.
3. Inked pixels become walls; a raycaster renders them in first person.

> Look at the minimap in the corner: it is the very page you are standing on.

## Things to find

- **Bold** text is navy, _emphasis_ is violet, `inline code` is teal.
- Links like [the Svelte docs](https://svelte.dev) are blue.
- [x] Find the code block
- [ ] Reach the end of the document

### A code block

```ts
const wall = alpha >= INK_THRESHOLD;
grid.cells[y * width + x] = wall ? material : Material.Empty;
```

### A table

| Element   | Colour  |
| --------- | ------- |
| Heading 1 | Crimson |
| Heading 2 | Orange  |
| Code      | Teal    |

---

## Open your own

Press **Open Markdown…** or drop a `.md` file onto the page to walk through it.
Big headings become towering fortresses; long paragraphs become mazes of words.

###### The end. Turn around.
