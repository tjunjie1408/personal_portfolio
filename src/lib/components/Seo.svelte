<!-- Title, description and share tags for one page. Every page renders exactly one. -->
<script lang="ts">
	import { site } from '$lib/content';

	let {
		title,
		description = site.description,
		path,
		type = 'website',
		published
	}: {
		title: string;
		description?: string;
		/** Path from the site root, starting with a slash. */
		path: string;
		type?: 'website' | 'article';
		/** YYYY-MM-DD, articles only. */
		published?: string;
	} = $props();

	const url = $derived(site.url + path);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={url} />
	<meta property="og:type" content={type} />
	<meta property="og:url" content={url} />
	<meta property="og:site_name" content={site.name} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:image" content="{site.url}/og.jpg" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content="Rodin's Thinker beside the line: I build things to understand them." />
	{#if published}<meta property="article:published_time" content={published} />{/if}
	<meta name="twitter:card" content="summary_large_image" />
</svelte:head>
