<script lang="ts">
	import { onMount } from 'svelte';
	import { gsap } from 'gsap';
	import { ScrollTrigger } from 'gsap/ScrollTrigger';
	import { about } from '$lib/content';
	import { reveal } from '$lib/motion/reveal';
	import portrait540 from '$lib/assets/portrait-540.webp';
	import portrait1080 from '$lib/assets/portrait-1080.webp';

	let frame: HTMLElement;

	onMount(() => {
		gsap.registerPlugin(ScrollTrigger);
		const mm = gsap.matchMedia();
		// The portrait is uncovered from below as it arrives, and settles from a slight zoom.
		mm.add('(prefers-reduced-motion: no-preference)', () => {
			gsap
				.timeline({ scrollTrigger: { trigger: frame, start: 'top 80%' }, defaults: { ease: 'expo.out' } })
				.fromTo(frame, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6 }, 0)
				.fromTo(frame.querySelector('img'), { scale: 1.12 }, { scale: 1, duration: 2.2 }, 0);
		});
		return () => mm.revert();
	});
</script>

<section id="about" class="about wrap seam" data-field="orbit" data-label="About">
	<figure class="portrait" bind:this={frame} data-field-anchor>
		<img
			src={portrait1080}
			srcset="{portrait540} 540w, {portrait1080} 1080w"
			sizes="(max-width: 767px) 100vw, 40vw"
			width="1080"
			height="1440"
			alt="Teo Jun Jie in a dark suit and tie, standing against a plain wall"
			loading="lazy"
			decoding="async"
		/>
	</figure>

	<div class="body">
		<h2 class="heading" data-reveal="lines" use:reveal>
			<span class="line-mask"><span class="line">About</span></span>
		</h2>

		<div class="paras">
			{#each about.paragraphs as paragraph, i (i)}
				<p class="para" data-reveal use:reveal={{ delay: 120 * (i + 1) }}>{paragraph}</p>
			{/each}
		</div>

		<dl class="facts">
			{#each about.facts as fact, i (fact.label)}
				<div class="fact" data-reveal use:reveal={{ delay: 100 * i }}>
					<dt class="label">{fact.label}</dt>
					<dd>{fact.value}</dd>
				</div>
			{/each}
		</dl>
	</div>
</section>

<style>
	.about {
		display: grid;
		grid-template-columns: repeat(12, minmax(0, 1fr));
		gap: 2rem;
		padding-block: clamp(6rem, 14vh, 9rem);
	}

	.portrait {
		grid-column: 1 / span 5;
		aspect-ratio: 3 / 4;
		position: relative;
		overflow: hidden;
		background: var(--bg-raised);
	}

	/* In colour. The file itself is graded: the warm wall of the original is pulled most of the way
	   to the page's neutral grey, while skin keeps its warmth. */
	.portrait img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: 50% 20%;
	}

	/* A touch dimmer on the dark page, so the pale wall does not glare. */
	:global([data-theme='dark']) .portrait img {
		filter: brightness(0.92);
	}

	.body {
		grid-column: 7 / -1;
		display: grid;
		align-content: space-between;
		gap: 2rem;
	}

	.heading {
		font-size: clamp(3rem, 6vw, 5.5rem);
		font-weight: 400;
		letter-spacing: -0.04em;
		line-height: 1;
	}

	.paras {
		display: grid;
		gap: 1.25rem;
	}

	.para {
		font-size: clamp(1.25rem, 1.9vw, 1.625rem);
		line-height: 1.4;
		letter-spacing: -0.02em;
		max-width: 30ch;
	}

	.facts {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 1.5rem;
		margin: 2rem 0 0;
		padding-top: 1.5rem;
		border-top: 1px solid var(--line);
	}

	dt {
		color: var(--muted);
		margin-bottom: 0.5rem;
	}

	dd {
		margin: 0;
		font-size: 0.9375rem;
		line-height: 1.45;
	}

	@media (max-width: 767px) {
		.about {
			grid-template-columns: 1fr;
		}

		.portrait,
		.body {
			grid-column: 1 / -1;
		}

		.facts {
			grid-template-columns: 1fr;
		}
	}
</style>
