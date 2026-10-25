<script lang="ts">
	import Button from '../atoms/Button.svelte';

	let { onload }: { onload: (name: string, text: string) => void } = $props();

	let input: HTMLInputElement;

	async function pick(event: Event) {
		const file = (event.currentTarget as HTMLInputElement).files?.[0];
		if (file) onload(file.name, await file.text());
		input.value = '';
	}
</script>

<Button variant="primary" onclick={() => input.click()}>Open Markdown…</Button>
<input
	bind:this={input}
	type="file"
	accept=".md,.markdown,.mdown,.txt,text/markdown,text/plain"
	hidden
	onchange={pick}
/>
