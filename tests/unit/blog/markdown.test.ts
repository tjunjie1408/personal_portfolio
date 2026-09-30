import assert from 'node:assert/strict';
import { test } from 'node:test';
import { imageNames } from '../../../src/lib/blog/markdown.ts';

test('finds images by file name, decoded, skipping remote ones', () => {
	const md = '![a](../assets/river%20bend.jpg "cap") ![b](https://x.dev/y.png) ![c](<c.svg>)';
	assert.deepEqual([...imageNames(md)], ['river bend.jpg', 'c.svg']);
});

test('ignores images inside code blocks, with LF or CRLF line ends', () => {
	for (const nl of ['\n', '\r\n']) {
		const md = ['```md', '![x](x.png)', '```', '![y](y.png)'].join(nl);
		assert.deepEqual([...imageNames(md)], ['y.png']);
	}
});
