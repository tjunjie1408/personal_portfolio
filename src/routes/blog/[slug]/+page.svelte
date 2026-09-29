<script lang="ts">
	import 'katex/dist/katex.min.css';
	import '$lib/blog/prose.css';
	import { formatDate, kindLabel } from '$lib/blog/format';
	import Seo from '$lib/components/Seo.svelte';
	import { site } from '$lib/content';

	let { data } = $props();
	const post = $derived(data.post);
</script>

<Seo
	title="{post.title} / {site.name}"
	description={post.description}
	path="/blog/{post.slug}"
	type="article"
	published={post.date}
/>

<article class="post wrap" class:note={post.kind === 'note'} data-field="sediment">
	<header class="head">
		<p class="meta mono">
			<time datetime={post.date}>{formatDate(post.date)}</time>
			<span>{post.minutes} min</span>
			<span>{kindLabel[post.kind]}</span>
			{#if post.draft}<span class="draft">Draft, not published</span>{/if}
		</p>
		<h1 class="title">{post.title}</h1>
		{#if post.kind === 'essay'}<p class="lede">{post.description}</p>{/if}
		{#if post.tags.length}
			<ul class="tags mono" aria-label="Tags">
				{#each post.tags as tag (tag)}
					<li><a href="/blog/tags/{tag}">#{tag}</a></li>
				{/each}
			</ul>
		{/if}
	</header>

	<div class="prose">
		<data.Body />
	</div>

	<footer class="foot">
		{#if post.updated}
			<p class="mono updated">Revised <time datetime={post.updated}>{formatDate(post.updated)}</time></p>
		{/if}
		<nav class="pager" aria-label="More writing">
			{#if data.older}
				<a class="older" href="/blog/{data.older.slug}">
					<span class="mono">Older</span>
					<span class="pager-title">{data.older.title}</span>
				</a>
			{/if}
			{#if data.newer}
				<a class="newer" href="/blog/{data.newer.slug}">
					<span class="mono">Newer</span>
					<span class="pager-title">{data.newer.title}</span>
				</a>
			{/if}
		</nav>
		<a class="back" href="/blog">All writing</a>
	</footer>
</article>

<style>
	.post {
		--measure: 44rem;
		display: grid;
		gap: clamp(3rem, 6vw, 4.5rem);
		padding-top: clamp(8rem, 18vh, 12rem);
		padding-bottom: clamp(6rem, 12vw, 9rem);
	}

	.post > * {
		width: 100%;
		max-width: var(--measure);
		margin-inline: auto;
	}

	.head {
		display: grid;
		gap: 1.25rem;
	}

	.meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem 1.25rem;
		color: var(--muted);
	}

	.draft {
		color: var(--accent);
	}

	.title {
		font-size: clamp(2.5rem, 6vw, 4.25rem);
		font-weight: 400;
		line-height: 1.05;
		letter-spacing: -0.035em;
	}

	.note .title {
		font-size: clamp(2rem, 4.5vw, 3rem);
	}

	.lede {
		font-size: clamp(1.125rem, 1.6vw, 1.3125rem);
		line-height: 1.5;
		color: var(--muted);
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem 1rem;
	}

	.tags a {
		color: var(--muted);
	}

	.tags a:hover {
		color: var(--river);
	}

	.foot {
		display: grid;
		gap: 2.5rem;
		padding-top: 2.5rem;
		border-top: 1px solid var(--line);
	}

	.updated {
		color: var(--muted);
	}

	.pager {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
	}

	.pager a {
		display: grid;
		gap: 0.4rem;
	}

	.pager .mono {
		color: var(--muted);
	}

	.pager-title {
		font-size: 1.125rem;
		line-height: 1.3;
		letter-spacing: -0.01em;
		transition: color 0.4s var(--ease-out);
	}

	.pager a:hover .pager-title {
		color: var(--accent);
	}

	.newer {
		grid-column: 2;
		text-align: right;
	}

	.back {
		justify-self: start;
		padding-bottom: 0.2rem;
		border-bottom: 1px solid currentColor;
	}

	.back:hover {
		color: var(--accent);
	}

	@media (max-width: 599px) {
		.pager {
			grid-template-columns: 1fr;
		}

		.newer {
			grid-column: 1;
			grid-row: 1;
			text-align: left;
		}
	}
</style>
