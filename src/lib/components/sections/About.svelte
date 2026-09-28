<script lang="ts">
	import { onMount } from 'svelte';
	import { gsap } from 'gsap';
	import { ScrollTrigger } from 'gsap/ScrollTrigger';
	import { about } from '$lib/content';
	import { reveal } from '$lib/motion/reveal';
	import { theme } from '$lib/theme.svelte';
	import Statue from '../Statue.svelte';

	let frame: HTMLElement;
	const accent = $derived(theme.current === 'dark' ? '#ff5a4a' : '#e0301f');

	onMount(() => {
		gsap.registerPlugin(ScrollTrigger);
		const mm = gsap.matchMedia();
		// The close-up is uncovered from below as it arrives; the camera inside does the rest.
		mm.add('(prefers-reduced-motion: no-preference)', () => {
			gsap.fromTo(
				frame,
				{ clipPath: 'inset(100% 0% 0% 0%)' },
				{
					clipPath: 'inset(0% 0% 0% 0%)',
					ease: 'expo.out',
					duration: 1.6,
					scrollTrigger: { trigger: frame, start: 'top 80%' }
				}
			);
		});
		return () => mm.revert();
	});
</script>

<section id="about" class="about wrap seam" data-field="orbit" data-label="About">
	<!-- A close-up of the Thinker stands in for a photo. -->
	<figure class="portrait" bind:this={frame} data-field-anchor>
		<Statue variant="portrait" {accent} />
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
		background: radial-gradient(60% 50% at 45% 42%, var(--halo), transparent 75%), var(--bg-raised);
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
