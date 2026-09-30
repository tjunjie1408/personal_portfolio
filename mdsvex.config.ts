// How blog Markdown becomes Svelte: math (KaTeX), code (Shiki) and a few Obsidian conventions.
// mdsvex 0.12 bundles remark 8, so remark plugins must be the old generation (remark-math@3);
// everything else here works on the HTML tree (rehype) and is version-independent.

import { transformerMetaHighlight, transformerMetaWordHighlight, transformerNotationDiff, transformerNotationFocus, transformerNotationHighlight } from '@shikijs/transformers';
import { escapeSvelte, mdsvex, type MdsvexOptions } from 'mdsvex';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import { bundledLanguages, createHighlighter } from 'shiki';
import { fileURLToPath } from 'node:url';
import { parseYaml } from './src/lib/blog/frontmatter.ts';
import { rehypeCallouts, rehypeEscapeBraces, rehypeHeadings, rehypeMark, rehypeUnwrapImages } from './src/lib/blog/rehype.ts';

const layout = fileURLToPath(new URL('./src/lib/components/blog/Markdown.svelte', import.meta.url));

/** The preprocessors for .md files, in order. */
export async function markdown() {
	return [stripObsidianComments, mdsvex(await options())];
}

/**
 * Removes Obsidian comments (`%%…%%`, inline or across lines) from the Markdown source before
 * mdsvex parses it. Code fences are left alone. Runs as a Svelte preprocessor ahead of mdsvex.
 */
const stripObsidianComments = {
	name: 'obsidian-comments',
	markup({ content, filename }: { content: string; filename?: string }) {
		if (!filename?.endsWith('.md') || !content.includes('%%')) return;
		const parts = content.split(/(^(?:```|~~~)[\s\S]*?^(?:```|~~~)[ \t]*$)/m);
		return { code: parts.map((p, i) => (i % 2 ? p : p.replace(/%%[\s\S]*?%%/g, ''))).join('') };
	}
};

async function options(): Promise<MdsvexOptions> {
	const shiki = await createHighlighter({ themes: ['vitesse-light', 'vitesse-dark'], langs: [] });

	return {
		extensions: ['.md'],
		// Shared with the draft filter and the index (src/lib/blog/frontmatter.ts).
		frontmatter: { type: 'yaml', marker: '-', parse: (yaml) => parseYaml(yaml) },
		// Only used to swap in components for plain elements (images); it renders no chrome itself.
		layout,
		smartypants: { dashes: 'oldschool' },
		remarkPlugins: [remarkMath],
		rehypePlugins: [
			rehypeKatex,
			rehypeUnwrapImages,
			rehypeCallouts,
			rehypeMark,
			rehypeHeadings,
			// Last: KaTeX output carries the TeX source, whose braces Svelte would read as expressions.
			rehypeEscapeBraces
		],
		highlight: {
			highlighter: async (code, lang, meta) => {
				const language = lang && lang in bundledLanguages ? lang : 'text';
				if (language !== 'text' && !shiki.getLoadedLanguages().includes(language)) {
					await shiki.loadLanguage(language as keyof typeof bundledLanguages);
				}
				const html = shiki.codeToHtml(code, {
					lang: language,
					// Both themes as CSS variables; prose.css picks one from [data-theme].
					themes: { light: 'vitesse-light', dark: 'vitesse-dark' },
					defaultColor: false,
					meta: { __raw: meta ?? '' },
					transformers: [
						transformerNotationHighlight(),
						transformerNotationDiff(),
						transformerNotationFocus(),
						transformerMetaHighlight(),
						transformerMetaWordHighlight()
					]
				});
				// ```ts title="load.ts" puts a file name above the block.
				const title = meta?.match(/title="([^"]+)"/)?.[1];
				const block = title
					? `<figure class="code"><figcaption class="mono">${escapeHtml(title)}</figcaption>${html}</figure>`
					: html;
				return `{@html \`${escapeSvelte(block)}\`}`;
			}
		}
	};
}

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
