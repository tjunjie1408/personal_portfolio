// A post's Markdown as readable text, with inline formulas kept whole: the list renders them with
// KaTeX, and plain-text places (meta description, RSS) show the TeX.

import { body } from './markdown.ts';

export type Piece = { kind: 'text'; value: string } | { kind: 'math'; tex: string };

// Code spans and formulas wait behind a private-use placeholder while emphasis is stripped.
const HOLD = '\uE000';
const held = new RegExp(`${HOLD}(\\d+)${HOLD}`, 'g');

/** Block-level syntax that has no place in a summary. */
function blocks(md: string): string {
	return body(md)
		.replace(/%%[\s\S]*?%%/g, ' ')
		.replace(/\$\$[\s\S]*?\$\$/g, ' ')
		.replace(/<\/?[A-Za-z][^>]*>/g, ' ')
		.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
		.replace(/\[\^[^\]]+\]:.*$/gm, ' ')
		.replace(/\[\^[^\]]+\]/g, '')
		.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
		.replace(/^[ \t]*(>[ \t]?)+/gm, '')
		.replace(/^\[![^\]]+\][+-]?[ \t]*/gm, '')
		.replace(/^[ \t]*#{1,6}[ \t]+/gm, '')
		.replace(/^[ \t]*([-*_][ \t]*){3,}$/gm, ' ')
		.replace(/^[ \t]*([-*+]|\d+[.)])[ \t]+(\[[ xX]\][ \t]+)?/gm, '')
		.replace(/^[ \t]*\|?[ \t]*:?-{3,}.*$/gm, ' ')
		.replace(/^[ \t]*\|(.*)\|[ \t]*$/gm, (_, row: string) => row.replace(/\|/g, ' '));
}

// Obsidian's rule (after Pandoc): `$` opens only before a non-space, closes only after a non-space
// and not before a digit, so "$5 and $10" stays money. A blank line ends the attempt.
const MATH = /(?<!\\)\$(?=[^\s$])((?:\\.|[^$\\\n]|\n(?![ \t]*\n))*?[^\s\\])\$(?!\d)/g;
const CODE = /(`+)([\s\S]*?[^`])\1(?!`)/g;

function emphasis(s: string): string {
	return s
		.replace(/==(?=\S)(.*?\S)==/g, '$1')
		.replace(/~~(?=\S)(.*?\S)~~/g, '$1')
		.replace(/\*\*(?=\S)(.*?\S)\*\*/g, '$1')
		.replace(/(?<!\w)__(?=\S)(.*?\S)__(?!\w)/g, '$1')
		.replace(/(?<![\w*])\*(?=[^\s*])(.*?[^\s*])\*(?![\w*])/g, '$1')
		.replace(/(?<!\w)_(?=[^\s_])(.*?[^\s_])_(?!\w)/g, '$1')
		.replace(/\\([\\`*_{}[\]()#+\-.!$=~|>])/g, '$1');
}

/** Markdown (a post body or a front-matter description) as text and inline formulas. */
export function pieces(markdown: string): Piece[] {
	const kept: Piece[] = [];
	const hold = (p: Piece) => `${HOLD}${kept.push(p) - 1}${HOLD}`;

	const text = emphasis(
		blocks(markdown)
			.replace(CODE, (_, _ticks, code: string) => hold({ kind: 'text', value: code.trim() }))
			.replace(MATH, (_, tex: string) => hold({ kind: 'math', tex: tex.trim() }))
	);

	const out: Piece[] = [];
	const push = (p: Piece) => {
		const last = out.at(-1);
		if (p.kind === 'text' && last?.kind === 'text') last.value += p.value;
		else out.push({ ...p });
	};
	let at = 0;
	for (const m of text.matchAll(held)) {
		push({ kind: 'text', value: text.slice(at, m.index) });
		push(kept[Number(m[1])]);
		at = m.index + m[0].length;
	}
	push({ kind: 'text', value: text.slice(at) });

	// One space between words across the whole summary, none at its ends.
	for (const p of out) if (p.kind === 'text') p.value = p.value.replace(/\s+/g, ' ');
	const first = out[0];
	const last = out.at(-1);
	if (first?.kind === 'text') first.value = first.value.trimStart();
	if (last?.kind === 'text') last.value = last.value.trimEnd();
	return out.filter((p) => p.kind === 'math' || p.value);
}

const size = (p: Piece) => [...(p.kind === 'text' ? p.value : p.tex)].length;

/**
 * At most `max` characters, counting a formula by its TeX. Latin text breaks at a word, CJK
 * anywhere; a formula that does not fit is left out whole rather than cut.
 */
export function clip(ps: Piece[], max = 160): Piece[] {
	if (ps.reduce((n, p) => n + size(p), 0) <= max) return ps;
	const out: Piece[] = [];
	let room = max;
	for (const p of ps) {
		if (size(p) <= room) {
			out.push(p);
			room -= size(p);
			continue;
		}
		if (p.kind === 'text' && room > 0) {
			const cut = [...p.value].slice(0, room).join('');
			const space = cut.lastIndexOf(' ');
			out.push({ kind: 'text', value: space > room * 0.6 ? cut.slice(0, space) : cut });
		}
		break;
	}
	const last = out.at(-1);
	if (last?.kind === 'text') last.value = last.value.replace(/[\s,.;:，。；：、]+$/, '');
	if (last?.kind === 'text') last.value += '…';
	else out.push({ kind: 'text', value: '…' });
	return out.filter((p) => p.kind === 'math' || p.value);
}

/** For meta descriptions and RSS: formulas as their TeX source. */
export const plainText = (ps: Piece[]) => ps.map((p) => (p.kind === 'text' ? p.value : p.tex)).join('');

const escapeHtml = (s: string) =>
	s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** For the page: text escaped, each formula rendered by `math` (KaTeX in the build). */
export const html = (ps: Piece[], math: (tex: string) => string) =>
	ps.map((p) => (p.kind === 'text' ? escapeHtml(p.value) : math(p.tex))).join('');
