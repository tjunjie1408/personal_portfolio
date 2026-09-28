<!--
	The page's one marquee, and the two sentences the site is built on. Both rows drift like a
	current and speed up with your scrolling: the river moves because you do.
	Heraclitus is set in stone grey with his name in the river colour; Hume, being about passion,
	is set in the accent.
-->
<script lang="ts">
	import ScrollVelocity from '../svelte-bits/ScrollVelocity.svelte';
	import { quotes } from '$lib/content';
</script>

<section class="quote seam" aria-label="Two quotations" data-field="split" data-label="Quotes">
	<figure>
		<blockquote class="river">
			<ScrollVelocity texts={[quotes.river.text]} velocity={34} />
		</blockquote>
		<figcaption class="wrap label river-cite">{quotes.river.cite}</figcaption>
	</figure>

	<figure>
		<blockquote class="passion">
			<ScrollVelocity texts={[quotes.passion.text]} velocity={34} reverse />
		</blockquote>
		<figcaption class="wrap label">{quotes.passion.cite}</figcaption>
	</figure>
</section>

<style>
	/* minmax(0, 1fr): the marquee tracks are thousands of pixels wide and must not size the grid. */
	.quote {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: clamp(3rem, 8vh, 5rem);
		padding-block: clamp(6rem, 16vh, 10rem);
		overflow: hidden;
	}

	figure {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 1.25rem;
	}

	blockquote {
		margin: 0;
		font-size: clamp(3rem, 7.5vw, 6rem);
		font-weight: 300;
		line-height: 1.08;
		letter-spacing: -0.04em;
	}

	.passion {
		font-style: italic;
		color: var(--accent);
	}

	figcaption {
		color: var(--muted);
	}

	.river-cite {
		color: var(--river);
	}
</style>
