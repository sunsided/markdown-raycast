<script lang="ts">
	let { title, depth, progress }: { title: string; depth: number; progress: number } = $props();
</script>

<div class="section">
	<span class="depth" aria-label="Heading level {depth}">{'#'.repeat(Math.max(depth, 1))}</span>
	<span class="title">{title}</span>
	<progress max="1" value={progress} aria-label="Position in document"></progress>
</div>

<style>
	.section {
		display: grid;
		grid-template-columns: auto 1fr;
		align-items: baseline;
		gap: var(--space-1) var(--space-2);
		min-width: 0;
	}

	.depth {
		color: var(--text-heading);
		font-family: var(--font-family-mono);
		font-weight: var(--font-weight-bold);
	}

	.title {
		overflow: hidden;
		font-weight: var(--font-weight-bold);
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	progress {
		grid-column: 1 / -1;
		width: 100%;
		height: 4px;
		appearance: none;
		border: none;
		border-radius: var(--radius-pill);
		background: var(--surface-sunken);
		accent-color: var(--accent);
	}

	progress::-webkit-progress-bar {
		border-radius: var(--radius-pill);
		background: var(--surface-sunken);
	}

	progress::-webkit-progress-value {
		border-radius: var(--radius-pill);
		background: var(--accent);
	}

	progress::-moz-progress-bar {
		border-radius: var(--radius-pill);
		background: var(--accent);
	}
</style>
