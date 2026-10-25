<script lang="ts">
	import '#lib/styles/tokens.css';
	import favicon from '#lib/assets/favicon.svg';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta
		name="description"
		content="Walk through a Markdown file as a first-person raycaster maze."
	/>
</svelte:head>

{@render children()}
