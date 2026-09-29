<!--
	mdsvex layout for every post. It adds no markup; its module exports replace plain elements in
	the compiled Markdown (an `img` export turns every ![](…) into <Img>).
-->
<script module lang="ts">
	export { default as img } from './Img.svelte';
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children?: Snippet } = $props();
</script>

{@render children?.()}
