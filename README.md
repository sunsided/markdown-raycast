# markdown-raycast

Walk through a Markdown file as if it were a maze. The document is rendered as text,
every glyph becomes a wall block, and a Wolfenstein-style raycaster lets you roam the
corridors between the letters while a minimap shows the page and where you are.

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
