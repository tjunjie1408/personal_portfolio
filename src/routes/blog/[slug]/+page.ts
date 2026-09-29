import type { Component } from 'svelte';

// Each post is its own chunk, loaded only on its page.
const bodies = import.meta.glob<Component>('/content/{essays,notes}/**/*.md', { import: 'default' });

export const load = async ({ data }) => ({
	...data,
	Body: await bodies[data.post.file]()
});
