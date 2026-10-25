<script lang="ts">
	import Panel from '../atoms/Panel.svelte';
	import SectionIndicator from '../molecules/SectionIndicator.svelte';

	let { title, depth, progress }: { title: string; depth: number; progress: number } = $props();
</script>

<Panel class="hud">
	<SectionIndicator {title} {depth} {progress} />
</Panel>

<style>
	:global(.hud) {
		width: min(24rem, calc(100vw - 2 * var(--space-4)));
	}
</style>
