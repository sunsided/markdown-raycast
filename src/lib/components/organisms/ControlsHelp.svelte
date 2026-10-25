<script lang="ts">
	import Panel from '../atoms/Panel.svelte';
	import KeyHint from '../molecules/KeyHint.svelte';
</script>

<Panel class="help">
	<p class="call">Click the view to start walking</p>
	<KeyHint keys={['W', 'A', 'S', 'D']} label="Walk and strafe" />
	<KeyHint keys={['←', '→']} label="Turn (or move the mouse)" />
	<KeyHint keys={['Shift']} label="Run" />
	<KeyHint keys={['M']} label="Toggle minimap" />
	<KeyHint keys={['Esc']} label="Release the mouse" />
	<p class="tip">Click the minimap to jump there. Drop a .md file anywhere to walk it.</p>
</Panel>

<style>
	:global(.help) {
		display: grid;
		gap: var(--space-2);
		max-width: 22rem;
	}

	.call {
		margin: 0 0 var(--space-2);
		font-size: var(--font-size-400);
		font-weight: var(--font-weight-bold);
		color: var(--text-heading);
	}

	.tip {
		margin: var(--space-2) 0 0;
		color: var(--text-secondary);
		font-size: var(--font-size-100);
	}
</style>
