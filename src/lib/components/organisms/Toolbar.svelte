<script lang="ts">
	import Button from '../atoms/Button.svelte';
	import FilePicker from '../molecules/FilePicker.svelte';

	interface Props {
		documentName: string;
		onload: (name: string, text: string) => void;
		onsample: () => void;
	}

	let { documentName, onload, onsample }: Props = $props();
</script>

<header class="toolbar">
	<h1 class="brand"><span class="hash">#</span> markdown-raycast</h1>
	<span class="document" title={documentName}>{documentName}</span>
	<div class="actions">
		<Button onclick={onsample}>Sample</Button>
		<FilePicker {onload} />
	</div>
</header>

<style>
	.toolbar {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-2) var(--space-4);
		border-bottom: 1px solid var(--border-subtle);
		background: var(--surface-page);
	}

	.brand {
		margin: 0;
		font-size: var(--font-size-400);
		line-height: var(--line-height-tight);
		white-space: nowrap;
	}

	.hash {
		color: var(--text-heading);
		font-family: var(--font-family-mono);
	}

	.document {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		color: var(--text-secondary);
		font-family: var(--font-family-mono);
		font-size: var(--font-size-200);
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.actions {
		display: flex;
		gap: var(--space-2);
	}

	@media (max-width: 640px) {
		.brand {
			font-size: var(--font-size-300);
		}

		.document {
			display: none;
		}

		.actions {
			margin-left: auto;
		}
	}
</style>
