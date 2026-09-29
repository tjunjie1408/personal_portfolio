<script lang="ts">
	import PostList from '$lib/components/blog/PostList.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { site } from '$lib/content';

	let { data } = $props();
</script>

<Seo title="Writing / {site.name}" description="Essays and research notes by {site.name}." path="/blog" />

<div class="blog wrap" data-field="sediment">
	<header class="head">
		<h1 class="h1">Writing</h1>
		<p class="sub">Essays once a thought has settled. Notes while it is still moving.</p>
		{#if data.tags.length}
			<ul class="tags mono" aria-label="Tags">
				{#each data.tags as { tag, count } (tag)}
					<li><a href="/blog/tags/{tag}">#{tag}<span class="count">{count}</span></a></li>
				{/each}
			</ul>
		{/if}
	</header>

	{#if data.essays.length}
		<section class="group" aria-labelledby="essays" data-label="Essays">
			<h2 id="essays" class="h2">Essays</h2>
			<PostList posts={data.essays} />
		</section>
	{/if}

	{#if data.notes.length}
		<section class="group" aria-labelledby="notes" data-label="Notes">
			<h2 id="notes" class="h2">Notes</h2>
			<PostList posts={data.notes} compact />
		</section>
	{/if}

	{#if !data.essays.length && !data.notes.length}
		<p class="empty">Nothing here yet. The first one is still being written.</p>
	{/if}
</div>

<style>
	.blog {
		display: grid;
		gap: clamp(4rem, 9vw, 7rem);
		padding-top: clamp(8rem, 18vh, 12rem);
		padding-bottom: clamp(6rem, 12vw, 10rem);
	}

	.head {
		display: grid;
		gap: 1.5rem;
	}

	.h1 {
		font-size: clamp(3.25rem, 9vw, 6rem);
		font-weight: 400;
		line-height: 1;
		letter-spacing: -0.04em;
	}

	.sub {
		max-width: 34ch;
		font-size: clamp(1.125rem, 1.6vw, 1.375rem);
		color: var(--muted);
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 1.25rem;
		margin-top: 0.5rem;
	}

	.tags a {
		color: var(--muted);
		transition: color 0.3s var(--ease-out);
	}

	.tags a:hover {
		color: var(--river);
	}

	.count {
		margin-left: 0.35em;
		opacity: 0.6;
	}

	.group {
		display: grid;
		gap: 1.5rem;
	}

	.h2 {
		font-size: clamp(1.5rem, 2.6vw, 2rem);
		font-weight: 400;
		letter-spacing: -0.03em;
	}

	.empty {
		color: var(--muted);
	}
</style>
