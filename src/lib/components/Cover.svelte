<!--
	A project's cover. A real screenshot wins when one exists; otherwise the project's own live
	drawing shows what it does.
-->
<script lang="ts">
	import type { Project } from '$lib/content';
	import Sketch from './Sketch.svelte';

	type Props = { project: Project; eager?: boolean };
	let { project, eager = false }: Props = $props();
</script>

<div class="cover">
	{#if project.image}
		<img
			src={project.image}
			alt="{project.title}: {project.imageAlt ?? 'screenshot'}"
			loading={eager ? 'eager' : 'lazy'}
			decoding="async"
		/>
	{:else}
		<Sketch kind={project.sketch} />
	{/if}
</div>

<style>
	.cover {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
		background: var(--bg-raised);
	}

	img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
</style>
