/**
 * Framework-agnostic entry point. The published `./vanilla` export is a
 * self-contained bundle (Svelte runtime included), so React, Vue or plain
 * JavaScript hosts need no Svelte tooling.
 */
import { mount as mountComponent, unmount } from 'svelte';
import MarkdownRaycaster from './components/MarkdownRaycaster.svelte';
import tokens from './styles/tokens.css?inline';

export interface RaycasterOptions {
	/** The Markdown document to walk through. */
	markdown: string;
	/**
	 * Add the default design tokens to the document (once). Set to `false` when
	 * the page provides its own tokens or imports `styles.css` itself.
	 * @default true
	 */
	injectStyles?: boolean;
}

export interface RaycasterHandle {
	/** Replaces the document and rebuilds the world. */
	setMarkdown(markdown: string): void;
	/** Unmounts the game and stops its render loop; resolves once teardown is complete. */
	destroy(): Promise<void>;
}

const STYLE_ID = 'markdown-raycast-tokens';

function injectTokens(doc: Document) {
	if (doc.getElementById(STYLE_ID)) return;
	const style = doc.createElement('style');
	style.id = STYLE_ID;
	style.textContent = tokens;
	doc.head.prepend(style);
}

/** Mounts the game into `target`, which should have a definite size. */
export function mount(target: HTMLElement, options: RaycasterOptions): RaycasterHandle {
	if (options.injectStyles !== false) injectTokens(target.ownerDocument);
	const props = $state({ markdown: options.markdown });
	const component = mountComponent(MarkdownRaycaster, { target, props });
	return {
		setMarkdown(markdown) {
			props.markdown = markdown;
		},
		destroy() {
			return unmount(component);
		}
	};
}
