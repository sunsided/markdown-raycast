import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

// Builds the self-contained `./vanilla` export: Svelte runtime, marked and component CSS
// are bundled so non-Svelte hosts can use the game without any Svelte tooling.
export default defineConfig({
	plugins: [svelte({ compilerOptions: { css: 'injected', runes: true } })],
	build: {
		outDir: 'dist/bundle',
		emptyOutDir: true,
		sourcemap: true,
		lib: {
			entry: 'src/lib/vanilla.svelte.ts',
			formats: ['es'],
			fileName: () => 'vanilla.js'
		}
	}
});
