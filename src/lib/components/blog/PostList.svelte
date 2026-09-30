<!--
	A column of posts. Essays show their argument in a sentence; notes are a quieter log, one line
	of their opening each. `showKind` labels each row when essays and notes are mixed (tag pages).
-->
<script lang="ts">
	// Summaries can carry inline formulas.
	import 'katex/dist/katex.min.css';
	import { formatDate, kindLabel } from '$lib/blog/format';
	import type { Post } from '$lib/blog/types';

	let { posts, compact = false, showKind = false }: { posts: Post[]; compact?: boolean; showKind?: boolean } =
		$props();
</script>

<ol class="list" class:compact>
	{#each posts as post (post.slug)}
		<li class="row">
			<p class="when mono">
				<time datetime={post.date}>{formatDate(post.date)}</time>
				{#if showKind}<span class="kind">{kindLabel[post.kind]}</span>{/if}
				{#if post.draft}<span class="draft">Draft</span>{/if}
			</p>
			<div class="body">
				<h3 class="title"><a href="/blog/{post.slug}">{post.title}</a></h3>
				<!-- Escaped text and KaTeX output, built in posts.ts. -->
				<p class="desc">{@html post.summary}</p>
				{#if !compact && post.tags.length}
					<ul class="tags mono" aria-label="Tags">
						{#each post.tags as tag (tag)}
							<li><a href="/blog/tags/{tag}">#{tag}</a></li>
						{/each}
					</ul>
				{/if}
			</div>
		</li>
	{/each}
</ol>

<style>
	.row {
		position: relative;
		display: grid;
		grid-template-columns: 9.5rem minmax(0, 44rem);
		gap: 0.5rem 2rem;
		padding-block: 1.75rem;
		border-top: 1px solid var(--line);
	}

	.compact .row {
		padding-block: 1.1rem;
	}

	.when {
		display: grid;
		align-content: start;
		gap: 0.2rem;
		padding-top: 0.45rem;
		color: var(--muted);
	}

	.compact .when {
		padding-top: 0.2rem;
	}

	.draft {
		color: var(--accent);
	}

	.body {
		display: grid;
		gap: 0.5rem;
	}

	.title {
		font-size: clamp(1.375rem, 2.2vw, 1.75rem);
		font-weight: 400;
		line-height: 1.2;
		letter-spacing: -0.025em;
	}

	.compact .title {
		font-size: 1.125rem;
		font-weight: 500;
		letter-spacing: -0.01em;
	}

	/* The whole row is the link's target; the title stays the only focusable element. */
	.title a::after {
		content: '';
		position: absolute;
		inset: 0;
	}

	.title a {
		transition: color 0.4s var(--ease-out);
	}

	.row:hover .title a {
		color: var(--accent);
	}

	.desc {
		max-width: 60ch;
		color: var(--muted);
	}

	.compact .desc {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem 1rem;
		margin-top: 0.25rem;
	}

	/* Tag links sit above the row's stretched link. */
	.tags a {
		position: relative;
		z-index: 1;
		color: var(--muted);
	}

	.tags a:hover {
		color: var(--river);
	}

	@media (max-width: 767px) {
		.row {
			grid-template-columns: minmax(0, 1fr);
		}

		.when {
			display: flex;
			gap: 1rem;
			padding-top: 0;
		}
	}
</style>
