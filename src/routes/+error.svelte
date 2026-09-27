<script lang="ts">
	import { page } from '$app/state';
</script>

<svelte:head>
	<title>{page.status} / Teo Jun Jie</title>
</svelte:head>

<section class="lost wrap">
	<p class="code mono">{page.status}</p>
	<h1 class="title">
		{#if page.status === 404}
			This page is not in the river <em>any more</em>.
		{:else}
			Something went wrong.
		{/if}
	</h1>
	<p class="sub">
		{page.status === 404 ? 'It may have moved, or it may never have been here.' : page.error?.message}
	</p>
	<a class="home" href="/">Back to the start</a>
</section>

<style>
	.lost {
		min-height: 100dvh;
		display: grid;
		align-content: center;
		gap: 1.5rem;
	}

	.code {
		color: var(--accent);
	}

	.title {
		max-width: 16ch;
		font-size: clamp(2.5rem, 6vw, 5rem);
		font-weight: 400;
		line-height: 1.05;
		letter-spacing: -0.04em;
	}

	.title em {
		font-weight: 300;
		color: var(--accent);
	}

	.sub {
		color: var(--muted);
	}

	.home {
		justify-self: start;
		padding-bottom: 0.2rem;
		border-bottom: 1px solid currentColor;
	}

	.home:hover {
		color: var(--accent);
	}
</style>
