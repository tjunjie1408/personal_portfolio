import { site } from '$lib/content';
import { getPosts } from '$lib/server/posts';

export const prerender = true;

const escape = (s: string) =>
	s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const rfc822 = (day: string) => new Date(`${day}T00:00:00Z`).toUTCString();

export function GET() {
	const posts = getPosts().filter((p) => !p.draft).slice(0, 40);
	const items = posts
		.map((p) => {
			const url = `${site.url}/blog/${p.slug}`;
			return `
		<item>
			<title>${escape(p.title)}</title>
			<link>${url}</link>
			<guid isPermaLink="true">${url}</guid>
			<pubDate>${rfc822(p.date)}</pubDate>
			<description>${escape(p.description)}</description>
			${p.tags.map((t) => `<category>${escape(t)}</category>`).join('')}
		</item>`;
		})
		.join('');

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
	<channel>
		<title>${escape(site.name)} / Writing</title>
		<link>${site.url}/blog</link>
		<atom:link href="${site.url}/rss.xml" rel="self" type="application/rss+xml" />
		<description>Essays and research notes by ${escape(site.name)}.</description>
		<language>en</language>
		${posts[0] ? `<lastBuildDate>${rfc822(posts[0].updated ?? posts[0].date)}</lastBuildDate>` : ''}${items}
	</channel>
</rss>`;

	return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
