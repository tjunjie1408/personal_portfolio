// Small rehype plugins for the blog, run by mdsvex at build time (see mdsvex.config.ts).
// They walk the HTML tree directly so they do not depend on the unified versions mdsvex bundles.

type Text = { type: 'text'; value: string };
type Raw = { type: 'raw'; value: string };
type Element = {
	type: 'element';
	tagName: string;
	properties: Record<string, unknown>;
	children: Node[];
};
type Parent = { type: string; children: Node[] };
type Node = Text | Raw | Element | { type: string; children?: Node[]; value?: string };

const isElement = (n: Node | undefined, tag?: string): n is Element =>
	n?.type === 'element' && (!tag || (n as Element).tagName === tag);
const isText = (n: Node | undefined): n is Text => n?.type === 'text';
const hasChildren = (n: Node): n is Parent => Array.isArray((n as Parent).children);
const classes = (el: Element): string[] => {
	const c = el.properties?.className;
	return Array.isArray(c) ? c.map(String) : typeof c === 'string' ? c.split(' ') : [];
};

/** Visits every element, parents first; return false to skip an element's children. */
function walk(node: Node, fn: (el: Element, parent: Parent) => boolean | void) {
	if (!hasChildren(node)) return;
	for (const child of node.children) {
		if (isElement(child) && fn(child, node) === false) continue;
		walk(child, fn);
	}
}

const textOf = (n: Node): string =>
	isText(n) ? n.value : hasChildren(n) ? n.children.map(textOf).join('') : '';

// Code, math and raw blocks keep their text as written.
const verbatim = (el: Element) =>
	['code', 'pre', 'script', 'style'].includes(el.tagName) || classes(el).includes('katex');

/** A paragraph holding only an image becomes the image, so it can render as a <figure>. */
export const rehypeUnwrapImages = () => (tree: Parent) => {
	walk(tree, (el, parent) => {
		if (!isElement(el, 'p')) return;
		const kids = el.children.filter((c) => !(isText(c) && !c.value.trim()));
		if (kids.length === 1 && isElement(kids[0], 'img')) parent.children[parent.children.indexOf(el)] = kids[0];
	});
};

// Obsidian callout types, folded into three looks: river (information), accent (risk), plain.
const CALLOUTS: Record<string, 'river' | 'accent' | 'plain'> = {
	note: 'river', info: 'river', tip: 'river', hint: 'river', important: 'river', abstract: 'river',
	summary: 'river', tldr: 'river', todo: 'river', example: 'river', question: 'river', faq: 'river',
	help: 'river', success: 'river', check: 'river', done: 'river',
	warning: 'accent', caution: 'accent', attention: 'accent', danger: 'accent', error: 'accent',
	bug: 'accent', failure: 'accent', fail: 'accent', missing: 'accent',
	quote: 'plain', cite: 'plain'
};

/**
 * `> [!note] Optional title` blockquotes become callouts, as in Obsidian and GitHub.
 * The fold markers (`[!note]-`, `[!note]+`) are accepted and ignored.
 */
export const rehypeCallouts = () => (tree: Parent) => {
	walk(tree, (el, parent) => {
		if (!isElement(el, 'blockquote')) return;
		const first = el.children.find((c) => isElement(c, 'p')) as Element | undefined;
		const lead = first?.children[0];
		if (!first || !isText(lead)) return;
		const m = lead.value.match(/^\[!(\w+)\][+-]?[ \t]*/);
		if (!m) return;

		const type = m[1].toLowerCase();
		lead.value = lead.value.slice(m[0].length);

		// The title runs to the end of the first line; the rest of that paragraph is body.
		const title: Node[] = [];
		const rest = [...first.children];
		while (rest.length) {
			const n = rest.shift()!;
			if (isText(n) && n.value.includes('\n')) {
				const cut = n.value.indexOf('\n');
				if (n.value.slice(0, cut)) title.push({ type: 'text', value: n.value.slice(0, cut) });
				const after = n.value.slice(cut + 1);
				if (after) rest.unshift({ type: 'text', value: after });
				break;
			}
			title.push(n);
		}
		if (!title.some((n) => textOf(n).trim())) {
			title.length = 0;
			title.push({ type: 'text', value: type[0].toUpperCase() + type.slice(1) });
		}
		first.children = rest;
		const body = rest.some((n) => textOf(n).trim() || isElement(n)) ? el.children : el.children.filter((c) => c !== first);

		parent.children[parent.children.indexOf(el)] = {
			type: 'element',
			tagName: 'aside',
			properties: { className: ['callout'], dataCallout: type, dataTone: CALLOUTS[type] ?? 'river' },
			children: [{ type: 'element', tagName: 'p', properties: { className: ['callout-title'] }, children: title }, ...body]
		};
		return false;
	});
};

/** Obsidian's `==highlight==` becomes <mark>. Works within one run of text (not across **bold**). */
export const rehypeMark = () => (tree: Parent) => {
	const re = /==(?=\S)([^=\n]*?\S)==/g;
	const visit = (node: Parent) => {
		node.children = node.children.flatMap((child): Node[] => {
			if (isElement(child)) {
				if (!verbatim(child)) visit(child);
				return [child];
			}
			if (!isText(child) || !child.value.includes('==')) return [child];
			const out: Node[] = [];
			let last = 0;
			for (const m of child.value.matchAll(re)) {
				if (m.index > last) out.push({ type: 'text', value: child.value.slice(last, m.index) });
				// mdsvex's serialiser expects `properties` on every element, even when empty.
				out.push({ type: 'element', tagName: 'mark', properties: {}, children: [{ type: 'text', value: m[1] }] });
				last = m.index + m[0].length;
			}
			if (last < child.value.length) out.push({ type: 'text', value: child.value.slice(last) });
			return out;
		});
	};
	visit(tree);
};

/** Slugs for heading anchors: lowercase, letters (any script) and digits, joined by hyphens. */
export const slugify = (s: string) =>
	s
		.normalize('NFKC')
		.toLowerCase()
		.replace(/[^\p{L}\p{N}\s-]/gu, '')
		.trim()
		.replace(/[\s-]+/g, '-');

/**
 * Gives h2 and h3 stable ids for links. h2s also get `data-label`, so the scroll rail shows an
 * essay's sections the way it shows the home page's.
 */
export const rehypeHeadings = () => (tree: Parent) => {
	const seen = new Map<string, number>();
	walk(tree, (el) => {
		if (!isElement(el, 'h2') && !isElement(el, 'h3')) return;
		const text = textOf(el).trim();
		const base = slugify(text) || 'section';
		const n = seen.get(base) ?? 0;
		seen.set(base, n + 1);
		el.properties = { ...el.properties, id: n ? `${base}-${n}` : base };
		if (el.tagName === 'h2') el.properties.dataLabel = text;
		return false;
	});
};

/**
 * Svelte reads braces in text as expressions, so `{1, 2, 3}` in a sentence would silently render
 * as `3`, and KaTeX's output carries the TeX source. Every brace in text is written as an entity;
 * braces in component attributes (`<Demo n={5} />`) are raw HTML here and keep working.
 */
export const rehypeEscapeBraces = () => (tree: Parent) => {
	const escape = (node: Parent) => {
		node.children = node.children.map((child) => {
			if (isText(child) && /[{}]/.test(child.value)) {
				const html = child.value
					.replace(/&/g, '&amp;')
					.replace(/</g, '&lt;')
					.replace(/>/g, '&gt;')
					.replace(/\{/g, '&#123;')
					.replace(/\}/g, '&#125;');
				return { type: 'raw', value: html } satisfies Raw;
			}
			if (hasChildren(child)) escape(child);
			return child;
		});
	};
	escape(tree);
};

