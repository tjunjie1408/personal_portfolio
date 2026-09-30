// Dev-only writing preview: every post, drafts included, and what to fix before it publishes.
// A build answers 404 and writes no page (handleHttpError in vite.config.ts).

import fs from 'node:fs';
import path from 'node:path';
import katex from 'katex';
import { error } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { pieces } from '$lib/blog/excerpt';
import { body, imageNames } from '$lib/blog/markdown';
import type { Post } from '$lib/blog/types';
import { getPosts, getSource } from '$lib/server/posts';

type Check = { level: 'error' | 'warn' | 'info'; text: string };
const order = { error: 0, warn: 1, info: 2 };

/** Display and inline formulas, outside code blocks. */
function formulas(source: string): string[] {
	const display = [...body(source).matchAll(/\$\$([\s\S]*?)\$\$/g)].map((m) => m[1].trim());
	const inline = pieces(source).flatMap((p) => (p.kind === 'math' ? [p.tex] : []));
	return [...display, ...inline];
}

function checks(post: Post, assets: Set<string>): Check[] {
	const { meta, source } = getSource(post.slug)!;
	const out: Check[] = [];
	const described = typeof meta.description === 'string' && meta.description.trim() !== '';

	if (post.draft) out.push({ level: 'info', text: 'Draft: shows only in npm run dev and is left out of the build. Remove draft: true to publish.' });
	if (post.kind === 'essay' && !described) {
		out.push({ level: post.draft ? 'warn' : 'error', text: 'Essays need a description before they publish, or the build fails.' });
	}
	if (post.kind === 'note' && !described) out.push({ level: 'info', text: 'No description, so the summary is taken from the start of the text.' });

	const length = [...post.description].length;
	if (length > 160) out.push({ level: 'warn', text: `The summary is ${length} characters; search results show roughly the first 155 to 160.` });
	if (!meta.slug && /[^\x00-\x7F]/.test(post.slug)) {
		out.push({ level: 'warn', text: `The link will be /blog/${post.slug}, which becomes a long %E7… string when shared. Set an English slug in the front matter.` });
	}
	if (post.updated && post.updated < post.date) out.push({ level: 'warn', text: 'The revision date (updated) is earlier than the publish date (date).' });

	for (const name of imageNames(source)) {
		if (!assets.has(name)) out.push({ level: 'error', text: `Image ${name} is not in content/assets, so the post page will fail.` });
	}
	for (const tex of formulas(source)) {
		try {
			katex.renderToString(tex, { throwOnError: true });
		} catch (e) {
			const where = tex.length > 40 ? `${tex.slice(0, 40)}…` : tex;
			out.push({ level: 'warn', text: `Formula doesn't parse: ${where} (${(e as Error).message.replace(/^KaTeX parse error: /, '')})` });
		}
	}
	if (!post.tags.length) out.push({ level: 'info', text: 'No tags.' });

	return out.sort((a, b) => order[a.level] - order[b.level]);
}

export const load = () => {
	if (!dev) error(404, 'Not found');

	const dir = path.resolve('content/assets');
	const assets = new Set(
		fs.existsSync(dir) ? (fs.readdirSync(dir, { recursive: true }) as string[]).map((f) => path.basename(f)) : []
	);

	return {
		posts: getPosts().map((post) => ({
			post,
			checks: checks(post, assets),
			// Opens the file in Obsidian, whatever the vault is called.
			obsidian: `obsidian://open?path=${encodeURIComponent(path.resolve(post.file.slice(1)))}`
		}))
	};
};
