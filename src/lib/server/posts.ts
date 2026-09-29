// The blog index, built from content/ at build time. Essays live in content/essays, notes in
// content/notes; the folder decides the kind. Front matter is described in content/README.md.

import { dev } from '$app/environment';
import { slugify } from '$lib/blog/rehype';
import type { Kind, Post } from '$lib/blog/types';

const metadata = import.meta.glob<Record<string, unknown> | undefined>('/content/{essays,notes}/**/*.md', {
	eager: true,
	import: 'metadata'
});
const sources = import.meta.glob<string>('/content/{essays,notes}/**/*.md', {
	eager: true,
	query: '?raw',
	import: 'default'
});

function fail(file: string, message: string): never {
	throw new Error(`${file}: ${message}`);
}

/** YAML dates arrive as Date objects, quoted ones as strings; both become YYYY-MM-DD. */
function day(value: unknown, file: string, field: string): string | undefined {
	if (value == null || value === '') return undefined;
	const d = value instanceof Date ? value : new Date(String(value));
	if (Number.isNaN(d.getTime())) fail(file, `"${field}" is not a date (use YYYY-MM-DD)`);
	return d.toISOString().slice(0, 10);
}

/** Plain text of a Markdown body, for excerpts and reading time. */
function plain(source: string): string {
	return source
		.replace(/^---[\s\S]*?\n---/, '')
		.replace(/```[\s\S]*?```/g, ' ')
		.replace(/\$\$[\s\S]*?\$\$/g, ' ')
		.replace(/%%[\s\S]*?%%/g, ' ')
		.replace(/<[^>]+>/g, ' ')
		.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
		.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
		.replace(/^\s*>\s*\[![^\]]+\][+-]?/gm, ' ')
		.replace(/^#+\s+/gm, '')
		.replace(/[*_`~=>#|$]/g, '')
		.replace(/\s+/g, ' ')
		.trim();
}

const CJK = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu;

/** About 230 English words or 450 CJK characters a minute. */
function minutes(text: string): number {
	const cjk = text.match(CJK)?.length ?? 0;
	const words = text.replace(CJK, ' ').split(/\s+/).filter(Boolean).length;
	return Math.max(1, Math.round(words / 230 + cjk / 450));
}

function excerpt(text: string, max = 160): string {
	const chars = [...text];
	if (chars.length <= max) return text;
	const cut = chars.slice(0, max).join('');
	// Break at a word in Latin text; CJK can break anywhere.
	const space = cut.lastIndexOf(' ');
	return (space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,.;:，。；：、]+$/, '') + '…';
}

function build(): Post[] {
	const posts: Post[] = [];
	const slugs = new Map<string, string>();

	for (const [file, meta = {}] of Object.entries(metadata)) {
		const kind: Kind = file.startsWith('/content/essays/') ? 'essay' : 'note';
		// Obsidian treats the file name as the title, so both fall back to it.
		const name = file.slice(file.lastIndexOf('/') + 1, -'.md'.length);
		const title = typeof meta.title === 'string' && meta.title.trim() ? meta.title.trim() : name;
		const slug = typeof meta.slug === 'string' && meta.slug ? slugify(meta.slug) : slugify(name);
		if (!slug) fail(file, 'needs a "slug" (the file name has no usable characters)');
		if (slugs.has(slug)) fail(file, `slug "${slug}" is already used by ${slugs.get(slug)}`);
		slugs.set(slug, file);

		const date = day(meta.date, file, 'date') ?? fail(file, 'needs a "date" (YYYY-MM-DD)');
		const text = plain(sources[file] ?? '');
		const draft = meta.draft === true;
		const description = typeof meta.description === 'string' ? meta.description.trim() : '';
		if (kind === 'essay' && !draft && !description) fail(file, 'essays need a "description" before they publish');

		const tags = meta.tags == null ? [] : Array.isArray(meta.tags) ? meta.tags : [meta.tags];
		posts.push({
			file,
			slug,
			kind,
			title,
			date,
			updated: day(meta.updated, file, 'updated'),
			description: description || excerpt(text),
			tags: [...new Set(tags.map((t) => slugify(String(t).replace(/^#/, ''))).filter(Boolean))],
			draft,
			minutes: minutes(text)
		});
	}

	return posts
		.filter((p) => dev || !p.draft)
		.sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
}

// Built once per server start; in dev, Vite reloads this module when a post changes.
const posts = build();

export const getPosts = (kind?: Kind) => (kind ? posts.filter((p) => p.kind === kind) : posts);

export const getPost = (slug: string) => posts.find((p) => p.slug === slug);

/** The next newer and next older post, across both kinds. */
export function neighbours(slug: string) {
	const i = posts.findIndex((p) => p.slug === slug);
	return { newer: posts[i - 1], older: posts[i + 1] };
}

export function getTags() {
	const counts = new Map<string, number>();
	for (const p of posts) for (const t of p.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
	return [...counts].map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}
