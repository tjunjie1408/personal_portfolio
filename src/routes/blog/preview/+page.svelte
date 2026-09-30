<!--
	Dev-only writing preview (see +page.server.ts). Meant to sit beside the editor: open
	http://localhost:5173/blog/preview in Obsidian's Web viewer while `npm run dev` runs.
-->
<script lang="ts">
	import { formatDate, kindLabel } from '$lib/blog/format';
	import { liveContent } from '$lib/blog/live';
	import PostList from '$lib/components/blog/PostList.svelte';
	import { site } from '$lib/content';

	let { data } = $props();
	liveContent();

	const host = new URL(site.url).host;
	const drafts = $derived(data.posts.filter((p) => p.post.draft).length);
	const blocked = $derived(data.posts.filter((p) => p.checks.some((c) => c.level === 'error')).length);
	const levelLabel = { error: 'Must fix', warn: 'Suggest', info: 'Note' };
	const count = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
</script>

<svelte:head>
	<title>Preview / {site.name}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="preview wrap" data-field="sediment">
	<header class="head">
		<p class="mono eyebrow">npm run dev only · not built</p>
		<h1 class="h1">Preview</h1>
		<p class="sub">How every post, drafts included, looks in the list, as a share card and in RSS. Save in Obsidian and this page updates.</p>
		<p class="mono stats">
			<span>{count(data.posts.length, 'post')}</span>
			<span>{count(drafts, 'draft')}</span>
			<span class:bad={blocked > 0}>{count(blocked, 'post')} to fix</span>
		</p>
	</header>

	{#if !data.posts.length}
		<p class="empty">No posts in content/essays or content/notes yet.</p>
	{/if}

	{#each data.posts as { post, checks, obsidian } (post.slug)}
		<section class="entry" aria-labelledby="p-{post.slug}">
			<header class="entry-head">
				<h2 id="p-{post.slug}" class="h2">{post.title}</h2>
				<p class="mono meta">
					<span class:draft={post.draft}>{post.draft ? 'Draft' : 'Published'}</span>
					<span>{kindLabel[post.kind]}</span>
					<time datetime={post.date}>{formatDate(post.date)}</time>
					<span>{post.minutes} min</span>
					<span class="file">{post.file.slice('/content/'.length)}</span>
				</p>
				<p class="mono links">
					<a href="/blog/{post.slug}">Open post /blog/{post.slug}</a>
					<a href={obsidian}>Open in Obsidian</a>
				</p>
			</header>

			{#if checks.length}
				<ul class="checks">
					{#each checks as check, i (i)}
						<li class={check.level}><span class="mono level">{levelLabel[check.level]}</span>{check.text}</li>
					{/each}
				</ul>
			{/if}

			<div class="views">
				<figure class="view list-view">
					<figcaption class="mono">List /blog</figcaption>
					<PostList posts={[post]} compact={post.kind === 'note'} />
				</figure>

				<figure class="view">
					<figcaption class="mono">Share card</figcaption>
					<div class="card">
						<img src="/og.jpg" alt="" width="1200" height="630" />
						<div class="card-text">
							<p class="card-host">{host}</p>
							<p class="card-title">{post.title} / {site.name}</p>
							<p class="card-desc">{post.description}</p>
						</div>
					</div>
				</figure>

				<figure class="view">
					<figcaption class="mono">RSS reader</figcaption>
					<div class="feed">
						<p class="feed-title">{post.title}</p>
						<p class="mono feed-date">{formatDate(post.date)}</p>
						<p class="feed-desc">{post.description}</p>
					</div>
				</figure>
			</div>
		</section>
	{/each}
</div>

<style>
	.preview {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: clamp(3rem, 7vw, 5rem);
		padding-top: clamp(8rem, 18vh, 12rem);
		padding-bottom: clamp(6rem, 12vw, 10rem);
	}

	.head {
		display: grid;
		gap: 1rem;
	}

	.eyebrow,
	.stats,
	.meta,
	.links {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem 1.25rem;
		color: var(--muted);
	}

	.eyebrow {
		color: var(--accent);
	}

	.h1 {
		font-size: clamp(3rem, 8vw, 5rem);
		font-weight: 400;
		line-height: 1;
		letter-spacing: -0.04em;
	}

	.sub {
		max-width: 46ch;
		color: var(--muted);
	}

	.bad,
	.draft {
		color: var(--accent);
	}

	.entry {
		display: grid;
		gap: 1.5rem;
		padding-top: 2rem;
		border-top: 1px solid var(--line);
	}

	.entry-head {
		display: grid;
		gap: 0.5rem;
	}

	.h2 {
		font-size: clamp(1.5rem, 2.6vw, 2rem);
		font-weight: 400;
		letter-spacing: -0.03em;
	}

	.file {
		overflow-wrap: anywhere;
	}

	.links a {
		color: var(--river);
	}

	.links a:hover {
		text-decoration: underline;
	}

	.checks {
		display: grid;
		gap: 0.5rem;
	}

	.checks li {
		display: flex;
		gap: 0.75rem;
		align-items: baseline;
		padding: 0.6rem 0.9rem;
		border-left: 2px solid var(--muted);
		background: var(--bg-raised);
	}

	.checks .error {
		border-color: var(--accent);
	}

	.checks .warn {
		border-color: var(--river);
	}

	.level {
		flex: none;
		color: var(--muted);
	}

	.error .level {
		color: var(--accent);
	}

	.views {
		display: grid;
		grid-template-columns: minmax(0, 2fr) repeat(2, minmax(0, 1fr));
		gap: 1.5rem;
		align-items: start;
	}

	.view {
		display: grid;
		gap: 0.75rem;
		min-width: 0;
	}

	.view figcaption {
		color: var(--muted);
	}

	/* The list row brings its own grid; here it only needs to fit the column. */
	.list-view :global(.row) {
		grid-template-columns: minmax(0, 1fr);
	}

	.card {
		overflow: hidden;
		border: 1px solid var(--line);
		border-radius: 0.75rem;
		background: var(--bg-raised);
	}

	.card img {
		display: block;
		width: 100%;
		height: auto;
		aspect-ratio: 1200 / 630;
		object-fit: cover;
	}

	.card-text {
		display: grid;
		gap: 0.25rem;
		padding: 0.75rem 0.9rem 0.9rem;
	}

	.card-host {
		font-size: 0.8125rem;
		color: var(--muted);
	}

	.card-title {
		font-weight: 500;
		line-height: 1.3;
	}

	.card-desc,
	.feed-desc {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		font-size: 0.875rem;
		color: var(--muted);
	}

	.feed {
		display: grid;
		gap: 0.25rem;
		padding: 0.9rem;
		border: 1px solid var(--line);
		border-radius: 0.5rem;
	}

	.feed-title {
		font-weight: 500;
	}

	.feed-date {
		color: var(--muted);
	}

	.feed-desc {
		-webkit-line-clamp: 4;
		line-clamp: 4;
	}

	.empty {
		color: var(--muted);
	}

	@media (max-width: 1023px) {
		.views {
			grid-template-columns: minmax(0, 1fr);
		}
	}
</style>
