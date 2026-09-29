import { getPosts, getTags } from '$lib/server/posts';

export const load = () => ({
	essays: getPosts('essay'),
	notes: getPosts('note'),
	tags: getTags()
});
