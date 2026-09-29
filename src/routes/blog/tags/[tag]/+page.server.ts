import { error } from '@sveltejs/kit';
import { getPosts, getTags } from '$lib/server/posts';

export const entries = () => getTags().map(({ tag }) => ({ tag }));

export const load = ({ params }) => {
	const posts = getPosts().filter((p) => p.tags.includes(params.tag));
	if (!posts.length) error(404, 'Not found');
	return { tag: params.tag, posts };
};
