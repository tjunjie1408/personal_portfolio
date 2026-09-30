// Decides which posts and images from content/ reach the bundle, through three virtual modules
// (types in virtual.d.ts). In dev they glob everything, drafts included, so Vite watches for new
// files. In a build they list published posts and the images those use, so a draft never enters
// the module graph; generateBundle then checks every chunk for anything that slipped through.

import fs from 'node:fs';
import path from 'node:path';
import { normalizePath, type EnvironmentModuleGraph, type EnvironmentModuleNode, type Plugin, type ResolvedConfig, type ViteDevServer } from 'vite';
import { frontmatter, isDraft } from './frontmatter.ts';
import { imageNames } from './markdown.ts';

type Published = { posts: { id: string; source: string }[]; assets: string[] };

// Case-sensitive, like the globs built from them.
const OPTIMISED = ['avif', 'heic', 'heif', 'jpeg', 'jpg', 'png', 'tiff', 'webp'];
const VERBATIM = ['gif', 'svg'];
const hasExt = (exts: string[]) => (id: string) => exts.includes(id.slice(id.lastIndexOf('.') + 1));

const POST_GLOB = `'/content/{essays,notes}/**/*.md'`;
const assetGlob = (exts: string[]) => `'/content/assets/**/*.{${exts.join(',')}}'`;
const s = JSON.stringify;

const modules: Record<string, { dev: string; build: (p: Published) => string }> = {
	'virtual:blog/posts': {
		dev: `export default import.meta.glob(${POST_GLOB}, { eager: true, query: '?raw', import: 'default' });`,
		build: ({ posts }) => `export default ${s(Object.fromEntries(posts.map((p) => [p.id, p.source])))};`
	},
	'virtual:blog/bodies': {
		// Accepting itself stops a body's HMR update here, before it reaches the page and reloads it.
		dev: [
			`export default import.meta.glob(${POST_GLOB}, { import: 'default' });`,
			`if (import.meta.hot) import.meta.hot.accept();`
		].join('\n'),
		build: ({ posts }) =>
			`export default {\n${posts.map((p) => `\t${s(p.id)}: () => import(${s(p.id)}).then((m) => m.default)`).join(',\n')}\n};`
	},
	'virtual:blog/assets': {
		dev: [
			`export const optimised = import.meta.glob(${assetGlob(OPTIMISED)}, { eager: true, query: { enhanced: true }, import: 'default' });`,
			`export const verbatim = import.meta.glob(${assetGlob(VERBATIM)}, { eager: true, query: '?url', import: 'default' });`
		].join('\n'),
		build: ({ assets }) => {
			const optimised = assets.filter(hasExt(OPTIMISED));
			const verbatim = assets.filter(hasExt(VERBATIM));
			return [
				...optimised.map((a, i) => `import o${i} from ${s(`${a}?enhanced`)};`),
				...verbatim.map((a, i) => `import v${i} from ${s(`${a}?url`)};`),
				`export const optimised = { ${optimised.map((a, i) => `${s(a)}: o${i}`).join(', ')} };`,
				`export const verbatim = { ${verbatim.map((a, i) => `${s(a)}: v${i}`).join(', ')} };`
			].join('\n');
		}
	}
};
const IDS = Object.keys(modules);

/** Files under root/dir as /dir/… ids (how import.meta.glob keys them), dotfiles skipped. */
function list(root: string, dir: string): string[] {
	const abs = path.join(root, dir);
	if (!fs.existsSync(abs)) return [];
	return (fs.readdirSync(abs, { recursive: true }) as string[])
		.map((rel) => rel.split(path.sep).join('/'))
		.filter((rel) => !rel.split('/').some((seg) => seg.startsWith('.')) && fs.statSync(path.join(abs, rel)).isFile())
		.map((rel) => `/${dir}/${rel}`);
}

function scan(root: string): Published {
	const posts: Published['posts'] = [];
	const used = new Set<string>();
	for (const id of [...list(root, 'content/essays'), ...list(root, 'content/notes')].filter((f) => f.endsWith('.md'))) {
		const source = fs.readFileSync(path.join(root, id), 'utf8');
		if (isDraft(frontmatter(source, id), id)) continue;
		posts.push({ id, source });
		for (const name of imageNames(source)) used.add(name);
	}
	const isAsset = (id: string) => hasExt(OPTIMISED)(id) || hasExt(VERBATIM)(id);
	const assets = list(root, 'content/assets').filter((id) => isAsset(id) && used.has(path.posix.basename(id)));
	return { posts, assets };
}

/** A file path in one comparable form: no query, forward slashes, lower case on Windows. */
function fileKey(file: string) {
	const p = normalizePath(file.replace(/^\0/, '').split('?')[0]);
	return process.platform === 'win32' ? p.toLowerCase() : p;
}

/** Drops a module and everything that imports it from the cache, so the next request re-runs them. */
function invalidateUp(graph: EnvironmentModuleGraph, from: Iterable<EnvironmentModuleNode | undefined>, timestamp: number) {
	const seen = new Set<EnvironmentModuleNode>();
	const visit = (mod: EnvironmentModuleNode | undefined) => {
		if (!mod || seen.has(mod)) return;
		seen.add(mod);
		graph.invalidateModule(mod, new Set(), timestamp, true);
		mod.importers.forEach(visit);
	};
	for (const mod of from) visit(mod);
}

export function blogContent(): Plugin {
	let config: ResolvedConfig;
	let published: Published | undefined;
	let server: ViteDevServer | undefined;
	let contentDir = '';

	return {
		name: 'blog-content',

		configResolved(resolved) {
			config = resolved;
			contentDir = fileKey(path.join(config.root, 'content')) + '/';
		},

		configureServer(dev) {
			server = dev;
		},

		buildStart() {
			if (config.command === 'build') published = scan(config.root);
		},

		resolveId(id) {
			if (IDS.includes(id)) return `\0${id}`;
		},

		load(id) {
			const mod = modules[id.slice(1)];
			if (id.startsWith('\0') && mod) return published ? mod.build(published) : mod.dev;
		},

		// Dev. A saved post changes server data (title, excerpt, tags) that HMR doesn't refresh, so the
		// server drops its cached index and open pages reload their data (live.ts), not the whole page.
		hotUpdate({ file, modules: changed, timestamp, type }) {
			if (!server || !fileKey(file).startsWith(contentDir)) return;
			if (this.environment.name === 'client') {
				// Pages hold the map of post chunks, so a post added or removed means a reload.
				if (type === 'update') return;
				this.environment.hot.send({ type: 'full-reload' });
				return [];
			}
			const graph = this.environment.moduleGraph;
			invalidateUp(graph, [...changed, ...IDS.map((id) => graph.getModuleById(`\0${id}`))], timestamp);
			server.environments.client.hot.send({ type: 'custom', event: 'blog:content' });
			return [];
		},

		generateBundle(_, bundle) {
			if (!published) return;
			const allowed = new Set([...published.posts.map((p) => p.id), ...published.assets].map((id) => fileKey(path.join(config.root, id))));
			for (const chunk of Object.values(bundle)) {
				if (chunk.type !== 'chunk') continue;
				const leak = chunk.moduleIds.find((id) => fileKey(id).startsWith(contentDir) && !allowed.has(fileKey(id)));
				if (leak) {
					this.error(
						`${path.relative(config.root, leak.split('?')[0])} is not published (a draft, or an image only drafts use) but was bundled into ${chunk.fileName}. ` +
							'Read content through virtual:blog/* (src/lib/blog/vite.ts), not import.meta.glob.'
					);
				}
			}
		}
	};
}
