// One YAML parser for mdsvex, the draft filter (vite.ts) and the index (posts.ts), so they can't
// disagree about whether a post is a draft.

import { parse } from 'yaml';
import { frontmatterText } from './markdown.ts';

/** YAML 1.2, so dates stay YYYY-MM-DD strings. Throws on invalid YAML. */
export function parseYaml(yaml: string, file = 'front matter'): Record<string, unknown> {
	let data: unknown;
	try {
		data = parse(yaml);
	} catch (e) {
		throw new Error(`${file}: front matter is not valid YAML (${(e as Error).message.split('\n')[0]})`);
	}
	if (data == null) return {};
	if (typeof data !== 'object' || Array.isArray(data)) throw new Error(`${file}: front matter must be key: value pairs`);
	return data as Record<string, unknown>;
}

export function frontmatter(source: string, file?: string): Record<string, unknown> {
	const yaml = frontmatterText(source);
	return yaml === undefined ? {} : parseYaml(yaml, file);
}

/** Strict on purpose: `draft: yes` or `draft: "true"` would otherwise publish a draft. */
export function isDraft(meta: Record<string, unknown>, file: string): boolean {
	const d = meta.draft;
	if (d == null) return false;
	if (typeof d !== 'boolean') throw new Error(`${file}: "draft" must be true or false, not ${JSON.stringify(d)}`);
	return d;
}
