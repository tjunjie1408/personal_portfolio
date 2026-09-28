<!--
	The Thinker sits above a river that is never the same twice. The red light on the marble,
	and every colour on the page, belongs to passion; the stone is reason.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { gsap } from 'gsap';
	import { ScrollTrigger } from 'gsap/ScrollTrigger';
	import River from '../svelte-bits/River.svelte';
	import Magnet from '../svelte-bits/Magnet.svelte';
	import Statue from '../Statue.svelte';
	import { hero } from '$lib/content';
	import { intro } from '$lib/motion/intro.svelte';
	import { theme } from '$lib/theme.svelte';

	let root: HTMLElement;
	let copy: HTMLDivElement;
	let played = false;

	// Canvas and WebGL need literal colours, so mirror the tokens from app.css here.
	const palette = $derived(
		theme.current === 'dark'
			? { river: 'rgba(236,236,234,0.13)', accent: '#ff5a4a' }
			: { river: 'rgba(20,20,22,0.16)', accent: '#e0301f' }
	);

	onMount(() => {
		gsap.registerPlugin(ScrollTrigger);
		const mm = gsap.matchMedia();
		// As the hero leaves, the copy drifts up and dims: a hand-off, not a hard cut.
		mm.add('(prefers-reduced-motion: no-preference)', () => {
			const leaving = { trigger: root, start: 'top top', end: 'bottom top', scrub: true };
			gsap.to(copy, { yPercent: -18, opacity: 0.15, ease: 'none', scrollTrigger: leaving });
			// The statue dims as the camera rises away from it.
			gsap.to(root.querySelector('.statue-layer'), { opacity: 0.2, ease: 'power1.in', scrollTrigger: leaving });
		});
		return () => mm.revert();
	});

	// Entrance runs once, as soon as the intro curtain starts lifting.
	$effect(() => {
		if (!intro.done || played) return;
		played = true;
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		gsap
			.timeline({ defaults: { ease: 'expo.out' } })
			.to(root.querySelector('.river-layer'), { opacity: 1, duration: 3, ease: 'power2.out' }, 0)
			.fromTo(
				root.querySelectorAll('.hero-line'),
				{ y: 0, yPercent: 110 },
				{ yPercent: 0, duration: 1.6, stagger: 0.12 },
				1.5
			)
			.to(root.querySelectorAll('.fade'), { opacity: 1, y: 0, duration: 1.4, stagger: 0.08 }, 1.9);
	});
</script>

<section id="top" class="hero" bind:this={root} data-field="current" data-label="Opening">
	<div class="river-layer">
		<River lineColor={palette.river} />
	</div>

	<div class="statue-layer">
		<Statue accent={palette.accent} />
	</div>

	<div class="copy wrap" bind:this={copy}>
		<div class="lead">
			<h1 class="title">
				{#each hero.lines as line (line.text)}
					<span class="line-mask">
						<span class="line hero-line">
							{line.text}{#if line.em}<em>{line.em}</em>{line.after}{/if}
						</span>
					</span>
				{/each}
			</h1>
		</div>

		<div class="aside">
			<p class="sub fade">{hero.sub}</p>
			<div class="ctas fade">
				<Magnet>
					<a class="btn primary" href={hero.primary.href}>{hero.primary.label}</a>
				</Magnet>
				<a class="btn ghost" href={hero.secondary.href}>{hero.secondary.label}</a>
			</div>
		</div>
	</div>
</section>

<style>
	.hero {
		position: relative;
		min-height: 100dvh;
		display: flex;
		align-items: flex-end;
		padding-block: 6rem clamp(2.5rem, 7vh, 5rem);
		overflow: hidden;
	}

	/* The river runs along the lower half, fading out before it reaches the figure's head. */
	.river-layer {
		position: absolute;
		inset: 38% 0 0;
		mask-image: linear-gradient(to bottom, transparent, #000 45%, #000 80%, transparent);
	}

	/* Full-bleed and centred. The rock dissolves toward the bottom so the text band reads over it. */
	.statue-layer {
		position: absolute;
		inset: 0;
		/* A soft halo behind the figure separates white stone from the page in both themes. */
		background: radial-gradient(34% 46% at 50% 40%, var(--halo), transparent 72%);
		mask-image: linear-gradient(to bottom, #000 46%, rgb(0 0 0 / 0.22) 70%, transparent 86%);
	}

	/* Bottom text band: headline on the left, the argument and the actions on the right. */
	.copy {
		position: relative;
		z-index: 1;
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 24rem);
		align-items: end;
		gap: 2rem 4rem;
		pointer-events: none;
	}

	.lead {
		display: grid;
		gap: clamp(1rem, 2.5vh, 1.5rem);
	}

	.aside {
		display: grid;
		gap: 1.5rem;
		padding-bottom: 0.4rem;
	}

	.copy :global(a),
	.copy :global(.magnet) {
		pointer-events: auto;
	}

	.title {
		font-size: clamp(2.6rem, 5.4vw, 5.25rem);
		font-weight: 400;
		line-height: 1;
		letter-spacing: -0.04em;
	}

	.title em {
		font-style: italic;
		font-weight: 300;
		color: var(--accent);
	}

	.sub {
		color: var(--muted);
		font-size: 1.0625rem;
		line-height: 1.55;
	}

	.ctas {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.btn {
		display: inline-flex;
		align-items: center;
		height: 3rem;
		padding-inline: 1.5rem;
		border: 1px solid var(--ink);
		white-space: nowrap;
		font-size: 0.9375rem;
		transition:
			background-color 0.4s var(--ease-out),
			color 0.4s var(--ease-out),
			transform 0.2s var(--ease-out);
	}

	.btn:active {
		transform: scale(0.98);
	}

	.primary {
		background: var(--ink);
		color: var(--bg);
	}

	.primary:hover {
		background: var(--accent);
		border-color: var(--accent);
		color: var(--accent-ink);
	}

	.ghost {
		background: color-mix(in srgb, var(--bg) 70%, transparent);
	}

	.ghost:hover {
		background: var(--ink);
		color: var(--bg);
	}

	/* Pre-entrance states, only when JS is present to play the entrance. */
	:global(.js) .river-layer {
		opacity: 0;
	}

	:global(.js) .hero-line {
		transform: translateY(110%);
	}

	:global(.js) .fade {
		opacity: 0;
		transform: translateY(1rem);
	}

	@media (prefers-reduced-motion: reduce) {
		:global(.js) .river-layer,
		:global(.js) .fade {
			opacity: 1;
			transform: none;
		}

		:global(.js) .hero-line {
			transform: none;
		}
	}

	@media (max-width: 767px) {
		.river-layer {
			inset: 30% 0 0;
		}

		.copy {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}

		.statue-layer {
			mask-image: linear-gradient(to bottom, #000 38%, rgb(0 0 0 / 0.2) 52%, transparent 62%);
		}
	}
</style>
