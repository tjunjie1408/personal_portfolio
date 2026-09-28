<!--
	Selected work. On wide screens the section pins and vertical scroll pans the track sideways,
	with each image drifting against the pan for depth. Narrow screens and reduced motion get a
	plain vertical list.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { gsap } from 'gsap';
	import { ScrollTrigger } from 'gsap/ScrollTrigger';
	import { projects } from '$lib/content';
	import { reveal } from '$lib/motion/reveal';
	import CaseStudy from '../CaseStudy.svelte';
	import Cover from '../Cover.svelte';

	let root: HTMLElement;
	let open = $state(-1);
	let track: HTMLDivElement;

	onMount(() => {
		gsap.registerPlugin(ScrollTrigger);
		const mm = gsap.matchMedia();
		mm.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
			const distance = () => track.scrollWidth - window.innerWidth;
			const pan = gsap.to(track, {
				x: () => -distance(),
				ease: 'none',
				scrollTrigger: {
					trigger: root,
					start: 'top top',
					end: () => `+=${distance()}`,
					pin: true,
					scrub: 1,
					invalidateOnRefresh: true
				}
			});

			root.querySelectorAll<HTMLElement>('.media .drift').forEach((img) => {
				gsap.fromTo(
					img,
					{ xPercent: -3 },
					{
						xPercent: 3,
						ease: 'none',
						scrollTrigger: {
							trigger: img.parentElement,
							containerAnimation: pan,
							start: 'left right',
							end: 'right left',
							scrub: true
						}
					}
				);
			});
		});
		return () => mm.revert();
	});
</script>

<section id="work" class="work seam" bind:this={root} data-field="stream" data-label="Work">
	<div class="track" bind:this={track}>
		<header class="intro">
			<h2 class="heading" data-reveal="lines" use:reveal>
				<span class="line-mask"><span class="line" style:--i="0">Selected</span></span>
				<span class="line-mask"><span class="line" style:--i="1">work</span></span>
			</h2>
			<p class="lede" data-reveal use:reveal={{ delay: 200 }}>
				Six projects, each an attempt to make one idea precise. Open any of them for the full case.
			</p>
		</header>

		{#each projects as project, i (project.title)}
			<article class="card" class:low={i % 2 === 1} data-reveal use:reveal>
				<button class="card-link" onclick={() => (open = i)} aria-haspopup="dialog">
					<figure class="media">
						<span class="drift"><Cover {project} /></span>
					</figure>
					<span class="title">{project.title}</span>
					<span class="summary">{project.summary}</span>
					<span class="foot">
						<span class="stack label">{project.kind}</span>
						<span class="read label">Read the case</span>
					</span>
				</button>
			</article>
		{/each}
	</div>
</section>

<CaseStudy {projects} index={open} onchange={(i) => (open = i)} />

<style>
	.work {
		position: relative;
		overflow: hidden;
	}

	.track {
		display: flex;
		align-items: center;
		gap: clamp(2rem, 5vw, 6rem);
		height: 100dvh;
		padding-inline: var(--gutter);
		padding-block: 5rem 3rem;
		width: max-content;
		will-change: transform;
	}

	.intro {
		width: min(34vw, 30rem);
		display: grid;
		gap: 1.75rem;
		align-self: center;
	}

	.heading {
		font-size: clamp(3.5rem, 7vw, 6rem);
		font-weight: 400;
		line-height: 0.95;
		letter-spacing: -0.04em;
	}

	.lede {
		color: var(--muted);
		max-width: 26ch;
	}

	.card {
		width: min(38vw, 36rem);
		align-self: flex-start;
	}

	.card.low {
		align-self: flex-end;
	}

	.card-link {
		display: grid;
		gap: 0.9rem;
		width: 100%;
		text-align: left;
	}

	.title,
	.summary,
	.foot {
		display: block;
	}

	.foot {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		padding-top: 0.9rem;
		border-top: 1px solid var(--line);
	}

	.read {
		position: relative;
		white-space: nowrap;
		color: var(--accent);
	}

	.read::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		bottom: -0.2rem;
		height: 1px;
		background: currentColor;
		transform: scaleX(0);
		transform-origin: right;
		transition: transform 0.6s var(--ease-out);
	}

	.card-link:hover .read::after,
	.card-link:focus-visible .read::after {
		transform: scaleX(1);
		transform-origin: left;
	}

	.media {
		overflow: hidden;
		aspect-ratio: 4 / 3;
		max-height: 56dvh;
		background: var(--bg-raised);
	}

	/* Slightly oversized so the sideways drift never shows an edge. */
	.drift {
		display: block;
		width: 106%;
		height: 100%;
		margin-left: -3%;
	}

	.title {
		font-size: clamp(1.75rem, 2.6vw, 2.5rem);
		font-weight: 400;
		letter-spacing: -0.035em;
		line-height: 1.1;
		transition: color 0.4s var(--ease-out);
	}

	.card-link:hover .title {
		color: var(--accent);
	}

	.summary {
		color: var(--muted);
		max-width: 42ch;
	}

	.stack {
		color: var(--muted);
	}

	@media (max-width: 899px) {
		.track {
			flex-direction: column;
			align-items: stretch;
			height: auto;
			width: auto;
			gap: 4.5rem;
			padding-block: 7rem 6rem;
		}

		.intro,
		.card {
			width: 100%;
		}

		.card.low {
			align-self: auto;
		}

		.media {
			max-height: none;
		}
	}

	@media (min-width: 900px) and (prefers-reduced-motion: reduce) {
		.track {
			flex-wrap: wrap;
			width: auto;
			height: auto;
			padding-block: 7rem;
		}
	}
</style>
