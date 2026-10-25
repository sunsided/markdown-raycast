<script lang="ts">
	import Button from '../atoms/Button.svelte';
	import Panel from '../atoms/Panel.svelte';
	import KeyHint from '../molecules/KeyHint.svelte';

	let { onstart }: { onstart: () => void } = $props();

	const hints = [
		{ keys: ['W', 'A', 'S', 'D'], label: 'Walk and strafe' },
		{ keys: ['←', '→'], label: 'Turn (or move the mouse)' },
		{ keys: ['Shift'], label: 'Run' },
		{ keys: ['M'], label: 'Toggle minimap' },
		{ keys: ['Esc'], label: 'Release the mouse' }
	];
</script>

<Panel class="help">
	<h2 class="call">Walk the page</h2>
	<ul class="hints" aria-label="Controls">
		{#each hints as hint (hint.label)}
			<li><KeyHint {...hint} /></li>
		{/each}
	</ul>
	<p class="tip">Click the minimap to jump there.</p>
	<Button variant="primary" onclick={onstart}>Start walking</Button>
</Panel>

<style>
	:global(.help) {
		display: grid;
		gap: var(--space-2);
		max-width: 22rem;
	}

	.hints {
		display: grid;
		gap: var(--space-2);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.call {
		margin: 0 0 var(--space-2);
		font-size: var(--font-size-400);
		font-weight: var(--font-weight-bold);
		color: var(--text-heading);
	}

	.tip {
		margin: var(--space-2) 0;
		color: var(--text-secondary);
		font-size: var(--font-size-100);
	}
</style>
