import adapter from '@sveltejs/adapter-vercel';
import { enhancedImages } from '@sveltejs/enhanced-img';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { markdown } from './mdsvex.config.ts';
import { blogContent } from './src/lib/blog/vite.ts';

export default defineConfig({
	plugins: [
		// Which posts reach the bundle: all of content/ in dev, published posts only in a build.
		blogContent(),
		// Must come before sveltekit() so <enhanced:img> is compiled before Svelte sees it.
		enhancedImages(),
		sveltekit({
			// Blog posts are Markdown (written in Obsidian, see content/README.md) compiled to components.
			extensions: ['.svelte', '.md'],
			preprocess: await markdown(),

			compilerOptions: {
				// Force runes mode for the project, except for libraries and mdsvex output, which still
				// uses legacy syntax ($$props). Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') || filename.endsWith('.md') ? undefined : true
			},

			prerender: {
				// Post and tag pages have no entries while every post is a draft; that is not an error.
				// Any other route that the crawler misses still fails the build.
				handleUnseenRoutes: ({ routes, message }) => {
					if (!routes.every((r) => r.startsWith('/blog/'))) throw new Error(message);
				},
				// /blog/preview exists only in `npm run dev`; in a build it answers 404 and is not written.
				handleHttpError: ({ path, status, message }) => {
					if (path === '/blog/preview' && status === 404) return;
					throw new Error(message);
				}
			},

			// Deployed on Vercel. The runtime is pinned so builds do not depend on the local Node
			// version; keep it in step with the project's Node.js setting on Vercel.
			adapter: adapter({ runtime: 'nodejs24.x' })
		})
	],
	// The Obsidian vault sits beside src/, outside the folders SvelteKit lets the dev server read.
	server: { fs: { allow: ['content'] } },
	ssr: {
		// gsap ships ESM files without "type": "module", so Node 24 on Vercel loads them as CommonJS
		// and the named imports fail at runtime. The Vercel packages only export under the "svelte"
		// condition, which plain Node does not resolve. Bundling all three into the server avoids both.
		noExternal: ['gsap', '@vercel/analytics', '@vercel/speed-insights']
	}
});
