import bodies from 'virtual:blog/bodies';

// Each post is its own chunk, loaded only on its page.
export const load = async ({ data }) => ({
	...data,
	Body: await bodies[data.post.file]()
});
