import { error } from '@sveltejs/kit';
import { getPost, getPosts, neighbours } from '$lib/server/posts';

export const entries = () => getPosts().map((p) => ({ slug: p.slug }));

export const load = ({ params }) => {
	const post = getPost(params.slug);
	if (!post) error(404, 'Not found');
	return { post, ...neighbours(post.slug) };
};
