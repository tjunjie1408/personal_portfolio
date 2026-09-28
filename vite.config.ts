import adapter from '@sveltejs/adapter-vercel';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// Deployed on Vercel. The runtime is pinned so builds do not depend on the local Node
			// version; keep it in step with the project's Node.js setting on Vercel.
			adapter: adapter({ runtime: 'nodejs24.x' })
		})
	],
	ssr: {
		// gsap ships ESM files without "type": "module", so Node 24 on Vercel loads them as CommonJS
		// and the named imports fail at runtime. Bundling it into the server build avoids that.
		noExternal: ['gsap']
	}
});
