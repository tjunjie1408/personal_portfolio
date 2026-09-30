// Small readers over raw Markdown source, shared by the build, the index and the preview.

const FRONTMATTER = /^\uFEFF?---\r?\n(?:([\s\S]*?)\r?\n)?---[ \t]*(?:\r?\n|$)/;
const FENCED = /^(```|~~~)[\s\S]*?^\1[ \t]*$/gm;

/** The YAML between the opening `---` lines, or undefined when there is none. */
export function frontmatterText(source: string): string | undefined {
	const m = source.match(FRONTMATTER);
	return m ? (m[1] ?? '') : undefined;
}

/** The body: front matter removed, line endings as \n, fenced code blanked out. */
export const body = (source: string) => source.replace(FRONTMATTER, '').replace(/\r\n?/g, '\n').replace(FENCED, ' ');

/** File names of the images a post uses, matched the way <Img> resolves them (last path segment). */
export function imageNames(source: string): Set<string> {
	const names = new Set<string>();
	for (const [, src] of body(source).matchAll(/!\[[^\]]*\]\(\s*<?([^)\s>]+)/g)) {
		if (/^(https?:)?\/\//.test(src)) continue;
		const name = src.split(/[?#]/)[0].split('/').pop() ?? '';
		try {
			names.add(decodeURIComponent(name));
		} catch {
			names.add(name);
		}
	}
	return names;
}
