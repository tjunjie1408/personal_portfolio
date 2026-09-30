// The virtual modules from src/lib/blog/vite.ts. In a build they hold published posts only.

declare module 'virtual:blog/posts' {
	/** Raw Markdown by file (/content/notes/….md). Server only. */
	const sources: Record<string, string>;
	export default sources;
}

declare module 'virtual:blog/bodies' {
	import type { Component } from 'svelte';
	/** Each post's compiled body, loaded on its own page. */
	const bodies: Record<string, () => Promise<Component>>;
	export default bodies;
}

declare module 'virtual:blog/assets' {
	import type { Picture } from '@sveltejs/enhanced-img';
	/** Images served optimised (avif/webp, sized). */
	export const optimised: Record<string, Picture>;
	/** GIF and SVG, served as they are. */
	export const verbatim: Record<string, string>;
}
