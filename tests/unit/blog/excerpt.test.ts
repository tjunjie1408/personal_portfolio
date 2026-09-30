import assert from 'node:assert/strict';
import { test } from 'node:test';
import { clip, html, pieces, plainText } from '../../../src/lib/blog/excerpt.ts';

const plain = (md: string) => plainText(pieces(md));

test('inline math is kept whole, with its equals sign', () => {
	assert.deepEqual(pieces('These ==highlights==, $e^{i\\pi} + 1 = 0$ and more'), [
		{ kind: 'text', value: 'These highlights, ' },
		{ kind: 'math', tex: 'e^{i\\pi} + 1 = 0' },
		{ kind: 'text', value: ' and more' }
	]);
});

test('money is not math', () => {
	assert.equal(plain('It costs $5 and $10 today.'), 'It costs $5 and $10 today.');
	assert.equal(plain('Between $ 5 and $ 10.'), 'Between $ 5 and $ 10.');
	assert.ok(pieces('Price $x$5').every((p) => p.kind === 'text'));
});

test('escaped dollars and code spans are never math', () => {
	assert.equal(plain('Literally \\$x\\$ here'), 'Literally $x$ here');
	assert.deepEqual(pieces('Run `echo $x$` now'), [{ kind: 'text', value: 'Run echo $x$ now' }]);
});

test('math inside emphasis survives, and emphasis markers inside math are left alone', () => {
	assert.deepEqual(pieces('**bold $a*b*c$ text**'), [
		{ kind: 'text', value: 'bold ' },
		{ kind: 'math', tex: 'a*b*c' },
		{ kind: 'text', value: ' text' }
	]);
});

test('display math, fenced code, comments, images and components are dropped', () => {
	const md = [
		'---',
		'date: 2026-09-29',
		'---',
		'Before',
		'',
		'$$',
		'x^2',
		'$$',
		'',
		'```ts',
		'const a = $b$;',
		'```',
		'%%private note%%',
		'![alt](../assets/a.png "cap")',
		'<Demo n={5} />',
		'After'
	].join('\n');
	assert.equal(plain(md), 'Before After');
});

test('Markdown syntax is removed but ordinary symbols stay', () => {
	assert.equal(plain('**bold** *it* ~~gone~~ _u_ snake_case_word'), 'bold it gone u snake_case_word');
	assert.equal(plain('a = b, C# and x > y, A|B'), 'a = b, C# and x > y, A|B');
	assert.equal(plain('## Heading\n\n> [!note] Title\n> body\n\n- [ ] task\n1. step'), 'Heading Title body task step');
	assert.equal(plain('[a link](https://x.dev) and a note[^1]'), 'a link and a note');
});

test('clip keeps short text as it is', () => {
	const ps = pieces('Short text.');
	assert.deepEqual(clip(ps, 160), ps);
});

test('clip cuts Latin text at a word and adds an ellipsis', () => {
	const out = plainText(clip(pieces('one two three four five six'), 16));
	assert.equal(out, 'one two three…');
});

test('clip never splits a formula', () => {
	const ps = clip(pieces('Some words then $\\sum_{i=1}^{n} x_i$ and more'), 20);
	assert.ok(ps.every((p) => p.kind === 'text'));
	assert.equal(plainText(ps), 'Some words then…');
});

test('clip cuts text with no spaces anywhere', () => {
	assert.equal(plainText(clip(pieces('Supercalifragilisticexpialidocious'), 6)), 'Superc…');
});

test('html escapes text and renders math through the callback', () => {
	const out = html(pieces('a < b & $x$'), (tex) => `<m>${tex}</m>`);
	assert.equal(out, 'a &lt; b &amp; <m>x</m>');
});
