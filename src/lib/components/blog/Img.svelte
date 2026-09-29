<!--
	Every Markdown image. Obsidian writes paths relative to the note (../assets/river.jpg), so the
	file is looked up by name in content/assets and served optimised (avif/webp, sized, lazy).
	The Markdown title becomes a caption: ![alt](river.jpg "Caption").
-->
<script module lang="ts">
	import type { Picture } from '@sveltejs/enhanced-img';

	const optimised = import.meta.glob<Picture>('/content/assets/**/*.{avif,heic,heif,jpeg,jpg,png,tiff,webp}', {
		eager: true,
		query: { enhanced: true },
		import: 'default'
	});
	// GIF (animation) and SVG (vector) are served as they are.
	const verbatim = import.meta.glob<string>('/content/assets/**/*.{gif,svg}', {
		eager: true,
		query: '?url',
		import: 'default'
	});

	const byName = (files: Record<string, unknown>) =>
		new Map(Object.entries(files).map(([path, v]) => [path.slice(path.lastIndexOf('/') + 1), v]));
	const pictures = byName(optimised) as Map<string, Picture>;
	const urls = byName(verbatim) as Map<string, string>;
</script>

<script lang="ts">
	let { src, alt = '', title }: { src: string; alt?: string; title?: string } = $props();

	// Resolved during render, so a mistyped file name fails the build instead of shipping a hole.
	const found = $derived.by(() => {
		if (/^(https?:)?\/\//.test(src)) return { url: src };
		const name = decodeURIComponent(src.split(/[?#]/)[0].split('/').pop() ?? '');
		const picture = pictures.get(name);
		const url = urls.get(name);
		if (!picture && !url) throw new Error(`Image "${src}" is not in content/assets.`);
		return { picture, url };
	});
</script>

<figure class="img">
	{#if found.picture}
		<enhanced:img src={found.picture} {alt} loading="lazy" decoding="async" />
	{:else}
		<img src={found.url} {alt} loading="lazy" decoding="async" />
	{/if}
	{#if title}<figcaption>{title}</figcaption>{/if}
</figure>
