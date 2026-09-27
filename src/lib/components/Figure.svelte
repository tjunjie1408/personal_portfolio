<!--
	A sentence whose **marked** parts are the evidence. Figures sit inside the prose, in the accent,
	instead of being pulled out into a big-number block.
-->
<script lang="ts">
	let { text }: { text: string } = $props();
	const parts = $derived(text.split('**'));
</script>

{#each parts as part, i (i)}{#if i % 2}<strong class="fig">{part}</strong>{:else}{part}{/if}{/each}

<style>
	.fig {
		font-weight: 500;
		color: var(--accent);
		font-variant-numeric: tabular-nums;
	}
</style>
