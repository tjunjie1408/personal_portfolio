import assert from 'node:assert/strict';
import { test } from 'node:test';
import { frontmatter, isDraft } from '../../../src/lib/blog/frontmatter.ts';

test('reads YAML front matter, with LF or CRLF line ends', () => {
	assert.deepEqual(frontmatter('---\ndate: 2026-09-29\ndraft: true\n---\nBody'), { date: '2026-09-29', draft: true });
	assert.deepEqual(frontmatter('---\r\ntags: [a, b]\r\n---\r\nBody'), { tags: ['a', 'b'] });
	assert.deepEqual(frontmatter('---\n---\nBody'), {});
	assert.deepEqual(frontmatter('No front matter'), {});
});

test('a --- inside a value does not end the front matter', () => {
	assert.deepEqual(frontmatter('---\ntitle: a---b\n---\n'), { title: 'a---b' });
});

test('invalid YAML fails with the file name', () => {
	assert.throws(() => frontmatter('---\ntitle: [unclosed\n---\n', 'x.md'), /x\.md: front matter is not valid YAML/);
});

test('draft must be a boolean, so a typo cannot publish a draft', () => {
	assert.equal(isDraft({ draft: true }, 'x.md'), true);
	assert.equal(isDraft({ draft: false }, 'x.md'), false);
	assert.equal(isDraft({}, 'x.md'), false);
	assert.throws(() => isDraft({ draft: 'yes' }, 'x.md'), /x\.md: "draft" must be true or false/);
	assert.throws(() => isDraft({ draft: 'true' }, 'x.md'), /must be true or false/);
});
