<!--
	Education and awards, as cards rather than a timeline: three short facts need no river. The
	degree leads at full width and the awards sit side by side under it. Each card rises in turn,
	and a short stretch of river draws along its top edge as it arrives.
-->
<script lang="ts">
	import { education } from '$lib/content';
	import { reveal } from '$lib/motion/reveal';
	import Figure from '../Figure.svelte';
</script>

<section
	id="education"
	class="education wrap seam"
	aria-labelledby="education-title"
	data-field="lattice"
	data-label="Education"
>
	<header class="head">
		<h2 id="education-title" class="heading" data-reveal="lines" use:reveal>
			<span class="line-mask"><span class="line" style:--i="0">Education</span></span>
			<span class="line-mask"><span class="line" style:--i="1">and awards</span></span>
		</h2>
		<p class="lede" data-reveal use:reveal={{ delay: 150 }}>
			A degree in progress, and one calculus title won twice.
		</p>
	</header>

	<ul class="cards">
		{#each education as item, i (item.title)}
			<li class="card" class:lead={i === 0} data-reveal use:reveal={{ delay: i * 120 }}>
				<p class="meta">
					<span class="kind label">{item.kind}</span>
					<span class="date mono">{item.date}</span>
				</p>
				<h3 class="title">{item.title}</h3>
				<p class="org">{item.org}</p>
				<p class="summary"><Figure text={item.summary} /></p>
			</li>
		{/each}
	</ul>
</section>

<style>
	.education {
		padding-block: clamp(6rem, 14vh, 9rem);
	}

	.head {
		display: grid;
		gap: 1.25rem;
		margin-bottom: clamp(3rem, 8vh, 5rem);
	}

	.heading {
		font-size: clamp(3rem, 6vw, 5.5rem);
		font-weight: 400;
		letter-spacing: -0.04em;
		line-height: 1;
	}

	.lede {
		color: var(--muted);
		max-width: 40ch;
	}

	.cards {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: clamp(1rem, 2.5vw, 2rem);
	}

	.card {
		position: relative;
		display: grid;
		align-content: start;
		gap: 0.6rem;
		padding: clamp(1.5rem, 3vw, 2.5rem);
		border: 1px solid var(--line);
		transition: border-color 0.5s var(--ease-out);
	}

	.card.lead {
		grid-column: 1 / -1;
	}

	/* The top edge: river colour fading into the hairline, drawn in when the card arrives. */
	.card::before {
		content: '';
		position: absolute;
		inset: -1px -1px auto;
		height: 1px;
		background: linear-gradient(90deg, var(--river), var(--line));
		transform-origin: left;
		transition: transform 1.2s var(--ease-out);
		transition-delay: calc(var(--reveal-delay, 0ms) + 200ms);
	}

	:global(.js) .card::before {
		transform: scaleX(0);
	}

	:global(.js) .card:global(.is-in)::before {
		transform: none;
	}

	.card:hover {
		border-color: var(--accent);
	}

	.meta {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 0.4rem;
	}

	.kind,
	.date {
		color: var(--muted);
	}

	.title {
		font-size: clamp(1.5rem, 2.4vw, 2.125rem);
		font-weight: 400;
		letter-spacing: -0.04em;
		line-height: 1.1;
	}

	.lead .title {
		font-size: clamp(1.875rem, 3.4vw, 3rem);
	}

	.org {
		color: var(--ink);
		opacity: 0.8;
	}

	.summary {
		color: var(--muted);
		max-width: 56ch;
	}

	@media (max-width: 767px) {
		.cards {
			grid-template-columns: 1fr;
		}
	}
</style>
