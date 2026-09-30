// The blog index, built from content/ at build time. Essays live in content/essays, notes in
// content/notes; the folder decides the kind. Front matter is described in content/README.md.
// In a build, `sources` holds published posts only (src/lib/blog/vite.ts).

import katex from 'katex';
import sources from 'virtual:blog/posts';
import { dev } from '$app/environment';
import { clip, html, pieces, plainText } from '$lib/blog/excerpt';
import { frontmatter, isDraft } from '$lib/blog/frontmatter';
import { slugify } from '$lib/blog/rehype';
import type { Kind, Post } from '$lib/blog/types';

/** Routes beside /blog/[slug] that a post's slug would collide with. */
const RESERVED = new Set(['preview']);

const math = (tex: string) => katex.renderToString(tex, { throwOnError: false });

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

const CJK = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu;

/** About 230 English words or 450 CJK characters a minute. */
function minutes(text: string): number {
	const cjk = text.match(CJK)?.length ?? 0;
	const words = text.replace(CJK, ' ').split(/\s+/).filter(Boolean).length;
	return Math.max(1, Math.round(words / 230 + cjk / 450));
}

type Entry = { post: Post; meta: Record<string, unknown>; source: string };

function build(): Entry[] {
	const entries: Entry[] = [];
	const slugs = new Map<string, string>();

	for (const [file, source] of Object.entries(sources)) {
		const meta = frontmatter(source, file);
		const kind: Kind = file.startsWith('/content/essays/') ? 'essay' : 'note';
		// Obsidian treats the file name as the title, so both fall back to it.
		const name = file.slice(file.lastIndexOf('/') + 1, -'.md'.length);
		const title = typeof meta.title === 'string' && meta.title.trim() ? meta.title.trim() : name;
		const slug = typeof meta.slug === 'string' && meta.slug ? slugify(meta.slug) : slugify(name);
		if (!slug) fail(file, 'needs a "slug" (the file name has no usable characters)');
		if (RESERVED.has(slug)) fail(file, `slug "${slug}" is taken by the /blog/${slug} page; set another "slug"`);
		if (slugs.has(slug)) fail(file, `slug "${slug}" is already used by ${slugs.get(slug)}`);
		slugs.set(slug, file);

		const date = day(meta.date, file, 'date') ?? fail(file, 'needs a "date" (YYYY-MM-DD)');
		const body = pieces(source);
		const draft = isDraft(meta, file);
		const description = typeof meta.description === 'string' ? meta.description.trim() : '';
		if (kind === 'essay' && !draft && !description) fail(file, 'essays need a "description" before they publish');
		// A written description is used whole; otherwise the text's opening is clipped.
		const summary = description ? pieces(description) : clip(body);

		const tags = meta.tags == null ? [] : Array.isArray(meta.tags) ? meta.tags : [meta.tags];
		const post: Post = {
			file,
			slug,
			kind,
			title,
			date,
			updated: day(meta.updated, file, 'updated'),
			description: plainText(summary),
			summary: html(summary, math),
			tags: [...new Set(tags.map((t) => slugify(String(t).replace(/^#/, ''))).filter(Boolean))],
			draft,
			minutes: minutes(plainText(body))
		};
		entries.push({ post, meta, source });
	}

	return entries
		.filter(({ post }) => dev || !post.draft)
		.sort((a, b) => b.post.date.localeCompare(a.post.date) || a.post.title.localeCompare(b.post.title));
}

// Built once per server start; in dev, Vite reloads this module when a post changes.
const entries = build();
const posts = entries.map((e) => e.post);

export const getPosts = (kind?: Kind) => (kind ? posts.filter((p) => p.kind === kind) : posts);

export const getPost = (slug: string) => posts.find((p) => p.slug === slug);

/** The next newer and next older post, across both kinds. */
export function neighbours(slug: string) {
	const i = posts.findIndex((p) => p.slug === slug);
	return { newer: posts[i - 1], older: posts[i + 1] };
}

/** Front matter and Markdown, for the checks on /blog/preview. */
export const getSource = (slug: string) => entries.find((e) => e.post.slug === slug);

export function getTags() {
	const counts = new Map<string, number>();
	for (const p of posts) for (const t of p.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
	return [...counts].map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}
