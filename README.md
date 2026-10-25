# markdown-raycast

Walk through a Markdown file as if it were a maze. The document is rendered as text,
every glyph becomes a wall block, and a Wolfenstein-style raycaster lets you roam the
corridors between the letters while a minimap shows the page and where you are.

**[Play it in the browser](https://sunsided.github.io/markdown-raycast/)**, or open your own `.md` file there.

[![A first-person view inside the sample document: an orange "How it works" heading towers behind a red list number and grey lines of text, with the minimap of the page in the corner.](https://raw.githubusercontent.com/sunsided/markdown-raycast/main/docs/screenshot.webp)](https://sunsided.github.io/markdown-raycast/)

## Development

Requires Node.js 24 with corepack enabled (`corepack enable`) and [Task](https://taskfile.dev).

```sh
task install   # yarn install
task dev       # start the dev server
task check     # types, lint, workflow lint (actionlint + zizmor)
task test      # unit tests
task build     # static build into build/
```

Run `task` to see every available task.

## Deployment

Pushes to `main` build the site with `BASE_PATH=/<repo>` and publish it to GitHub Pages
(`.github/workflows/pages.yaml`). Work happens on `feature/*` branches merged via pull request.

Pushing a `v*` tag runs the full check/test/build pipeline and, if it passes, creates a GitHub
release with the zipped static site and its SHA-256 checksum (`.github/workflows/release.yaml`).
Tags containing a `-` (e.g. `v1.0.0-rc.1`) are published as pre-releases.

## Package

The engine and the game ship as [`@sunsided/markdown-raycast`](https://github.com/sunsided/markdown-raycast/pkgs/npm/markdown-raycast), published to npmjs and GitHub Packages from `v*` tags.

| Entry point                             | What it is                                                                           |
| --------------------------------------- | ------------------------------------------------------------------------------------ |
| `@sunsided/markdown-raycast`            | Framework-agnostic engine: layout, rasterizer, raycaster, renderer, minimap          |
| `@sunsided/markdown-raycast/svelte`     | `<MarkdownRaycaster markdown={…} />` Svelte 5 component                              |
| `@sunsided/markdown-raycast/vanilla`    | `mount(element, { markdown })` with the Svelte runtime bundled in, for any framework |
| `@sunsided/markdown-raycast/styles.css` | Default design tokens; override any `--token` on `:root`                             |

```svelte
<script>
	import '@sunsided/markdown-raycast/styles.css';
	import { MarkdownRaycaster } from '@sunsided/markdown-raycast/svelte';
</script>

<div style="height: 80vh"><MarkdownRaycaster markdown={'# Hello\n\nWalk me.'} /></div>
```

```js
import { mount } from '@sunsided/markdown-raycast/vanilla';

const game = mount(document.getElementById('game'), { markdown: '# Hello' });
game.setMarkdown('# Another file');
await game.destroy();
```

The container needs a definite size. Keys are only handled while the game view has focus,
so the host page keeps its own shortcuts.

Installing from GitHub Packages needs a token with `read:packages`, even for this public package;
installing from npmjs needs none.

## License

Licensed under any of [EUPL-1.2](LICENSE-EUPL), [MIT](LICENSE-MIT) or [Apache-2.0](LICENSE-APACHE), at your option.
