<script lang="ts">
	import { liveContent } from '$lib/blog/live';
	import PostList from '$lib/components/blog/PostList.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { site } from '$lib/content';

	let { data } = $props();
	liveContent();
</script>

<Seo
	title="#{data.tag} / Writing / {site.name}"
	description="Essays and notes tagged {data.tag}."
	path="/blog/tags/{data.tag}"
/>

<div class="tag wrap" data-field="sediment">
	<header class="head">
		<a class="back" href="/blog">Writing</a>
		<h1 class="h1">#{data.tag}</h1>
		<p class="mono count">{data.posts.length} {data.posts.length === 1 ? 'piece' : 'pieces'}</p>
	</header>
	<PostList posts={data.posts} showKind />
</div>

<style>
	.tag {
		display: grid;
		gap: 3rem;
		padding-top: clamp(8rem, 18vh, 12rem);
		padding-bottom: clamp(6rem, 12vw, 10rem);
	}

	.head {
		display: grid;
		gap: 1rem;
	}

	.back {
		justify-self: start;
		color: var(--muted);
	}

	.back:hover {
		color: var(--accent);
	}

	.h1 {
		font-size: clamp(2.75rem, 7vw, 5rem);
		font-weight: 400;
		line-height: 1;
		letter-spacing: -0.04em;
		overflow-wrap: anywhere;
	}

	.count {
		color: var(--muted);
	}
</style>
