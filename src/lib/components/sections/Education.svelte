<!--
	Education and awards, as an integral. Two of the three entries are calculus titles, and a
	degree is the sum of what it has accumulated, so the section is a Riemann sum under a learning
	curve (see $lib/three/integral). Each entry owns one stretch of the x axis; as you read down
	the list the upper bound sweeps right, the bars rise to meet the curve, and the entry's year
	fills from the foot up, like area under the curve. The last stretch stays a ghost: the sum is
	not finished.

	Wide screens pin the stage beside the list. Narrow screens pin a shorter stage above it. Under
	reduced motion the stage renders once, complete.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { education } from '$lib/content';
	import { reveal } from '$lib/motion/reveal';
	import { theme } from '$lib/theme.svelte';
	import Figure from '../Figure.svelte';

	const n = education.length;
	const first = education[0].numeral ?? education[0].date;

	let list: HTMLOListElement;
	let stage: HTMLDivElement;
	let readout: HTMLSpanElement;
	let current = $state(-1);
	let status = $state<'loading' | 'ready' | 'none'>('loading');

	let recolour: (() => void) | null = null;
	$effect(() => {
		void theme.current;
		// The theme attribute changes in the same tick; read the new tokens once styles apply.
		const id = requestAnimationFrame(() => recolour?.());
		return () => cancelAnimationFrame(id);
	});

	onMount(() => {
		let disposed = false;
		let cleanup = () => {};

		(async () => {
			const [THREE, { createIntegral }, { gsap }, { ScrollTrigger }] = await Promise.all([
				import('three'),
				import('$lib/three/integral'),
				import('gsap'),
				import('gsap/ScrollTrigger')
			]);
			if (disposed) return;
			gsap.registerPlugin(ScrollTrigger);

			let plot: ReturnType<typeof createIntegral>;
			try {
				plot = createIntegral(THREE, stage, n);
			} catch {
				status = 'none';
				return;
			}

			const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
			const token = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
			recolour = () => {
				plot.setColours({ ink: token('--ink'), river: token('--river'), accent: token('--accent'), bg: token('--bg') });
				if (reduce) plot.frame(0, 0, true);
			};
			recolour();

			const ro = new ResizeObserver(() => {
				plot.resize();
				if (reduce) plot.frame(0, 0, true);
			});
			ro.observe(stage);
			plot.resize();
			status = 'ready';

			if (reduce) {
				plot.setBound(n);
				plot.frame(0, 0, true);
				readout.textContent = plot.area().toFixed(2);
				current = n - 1;
				cleanup = () => {
					ro.disconnect();
					plot.dispose();
				};
				return;
			}

			// The bound follows the list: 0 as the first entry reaches the reading line, `n` as the
			// last one leaves it. On narrow screens the pinned stage covers the top of the screen,
			// so the reading line sits lower, in the middle of what is left.
			const line = matchMedia('(max-width: 1023px)').matches ? '72%' : '55%';
			const st = ScrollTrigger.create({
				trigger: list,
				start: `top ${line}`,
				end: `bottom ${line}`,
				onUpdate: (self) => {
					const u = self.progress * n;
					plot.setBound(u);
					const i = self.progress <= 0 ? -1 : Math.min(n - 1, Math.floor(u));
					if (i !== current) current = i;
				},
				onRefresh: (self) => plot.setBound(self.progress * n)
			});

			const onPointer = (e: PointerEvent) => {
				const r = stage.getBoundingClientRect();
				plot.setPointer(((e.clientX - r.left) / r.width) * 2 - 1, ((e.clientY - r.top) / r.height) * 2 - 1);
			};
			const onLeave = () => plot.setPointer(0, 0);
			stage.addEventListener('pointermove', onPointer);
			stage.addEventListener('pointerleave', onLeave);

			// Render only while the stage is on screen and the tab is visible.
			let raf = 0;
			let last = 0;
			let onScreen = false;
			let lastArea = '';
			const tick = (t: number) => {
				const dt = Math.min((t - last) / 1000, 0.05);
				last = t;
				plot.frame(dt, t / 1000);
				const a = plot.area().toFixed(2);
				if (a !== lastArea) readout.textContent = lastArea = a;
				raf = requestAnimationFrame(tick);
			};
			const run = () => {
				cancelAnimationFrame(raf);
				if (onScreen && !document.hidden) {
					last = performance.now();
					raf = requestAnimationFrame(tick);
				}
			};
			const io = new IntersectionObserver(([entry]) => {
				onScreen = entry.isIntersecting;
				run();
			});
			io.observe(stage);
			document.addEventListener('visibilitychange', run);

			cleanup = () => {
				cancelAnimationFrame(raf);
				io.disconnect();
				ro.disconnect();
				st.kill();
				document.removeEventListener('visibilitychange', run);
				stage.removeEventListener('pointermove', onPointer);
				stage.removeEventListener('pointerleave', onLeave);
				plot.dispose();
			};
		})();

		return () => {
			disposed = true;
			recolour = null;
			cleanup();
		};
	});
</script>

<section id="education" class="education seam" aria-labelledby="education-title" data-field="rise" data-label="Education">
	<div class="wrap">
		<header class="head">
			<h2 id="education-title" class="heading" data-reveal="lines" use:reveal>
				<span class="line-mask"><span class="line" style:--i="0">Education</span></span>
				<span class="line-mask"><span class="line" style:--i="1">and awards</span></span>
			</h2>
			<p class="lede" data-reveal use:reveal={{ delay: 150 }}>
				A degree in progress, and one calculus title won twice. What I know is the area under the curve so far.
			</p>
		</header>

		<div class="body">
			<ol class="entries" bind:this={list}>
				{#each education as item, i (item.title)}
					<li class="entry" class:active={i === current} class:passed={i < current}>
						<p class="numeral" aria-hidden="true">{item.numeral ?? item.date}</p>
						<div class="text">
							<p class="meta">
								<span class="index mono">{String(i + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}</span>
								<span class="kind label" class:award={item.kind === 'Award'}>{item.kind}</span>
								<span class="date mono">{item.date}</span>
							</p>
							<h3 class="title">{item.title}</h3>
							<p class="org">{item.org}</p>
							<p class="summary"><Figure text={item.summary} /></p>
						</div>
					</li>
				{/each}
			</ol>

			<div class="stage-col" aria-hidden="true">
				<div class="stage" class:ready={status === 'ready'} bind:this={stage}>
					<p class="formula mono">
						<span class="int">∫</span><span class="bounds"
							><span class="upper">{current >= 0 ? (education[current].numeral ?? education[current].date) : first}</span
							><span class="lower">{first}</span></span
						> learning dt
					</p>
					<p class="sum mono">Σ f(xᵢ)Δx ≈ <span bind:this={readout}>0.00</span></p>
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	.education {
		padding-block: clamp(6rem, 14vh, 9rem) clamp(4rem, 10vh, 7rem);
	}

	.head {
		display: grid;
		gap: 1.25rem;
		margin-bottom: clamp(2rem, 6vh, 4rem);
	}

	.heading {
		font-size: clamp(3rem, 6vw, 5.5rem);
		font-weight: 400;
		letter-spacing: -0.04em;
		line-height: 1;
	}

	.lede {
		color: var(--muted);
		max-width: 44ch;
	}

	.body {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
		gap: clamp(2rem, 4vw, 4rem);
	}

	.entries {
		grid-column: 1;
		grid-row: 1;
		padding-block: 22svh;
	}

	.entry {
		min-height: 68svh;
		display: grid;
		align-content: center;
		gap: 1.25rem;
	}

	/* The year fills from its foot as the bound reaches the entry: area under the curve. */
	.numeral {
		font-size: clamp(4.5rem, 10vw, 9.5rem);
		font-weight: 300;
		letter-spacing: -0.06em;
		line-height: 0.85;
		font-variant-numeric: tabular-nums;
		color: transparent;
		-webkit-text-stroke: 1px var(--muted);
		background: linear-gradient(var(--ink), var(--ink)) no-repeat 0 100% / 100% 0%;
		-webkit-background-clip: text;
		background-clip: text;
		opacity: 0.55;
		transition:
			background-size 1.2s var(--ease-out),
			opacity 0.8s var(--ease-out),
			-webkit-text-stroke-color 0.8s var(--ease-out);
	}

	.passed .numeral {
		background-image: linear-gradient(var(--river), var(--river));
		background-size: 100% 100%;
		-webkit-text-stroke-color: transparent;
		opacity: 0.35;
	}

	.active .numeral {
		background-size: 100% 100%;
		-webkit-text-stroke-color: transparent;
		opacity: 1;
	}

	.text {
		display: grid;
		gap: 0.55rem;
		max-width: 34rem;
		opacity: 0.4;
		transform: translateX(-0.75rem);
		transition:
			opacity 0.8s var(--ease-out),
			transform 1s var(--ease-out);
	}

	.active .text,
	.passed .text {
		opacity: 1;
		transform: none;
	}

	.passed .text {
		opacity: 0.6;
	}

	.meta {
		display: flex;
		align-items: baseline;
		gap: 1.25rem;
		color: var(--muted);
		margin-bottom: 0.3rem;
	}

	.date {
		margin-left: auto;
	}

	.kind.award::before {
		content: '';
		display: inline-block;
		width: 0.4rem;
		height: 0.4rem;
		margin-right: 0.5rem;
		background: var(--accent);
		transform: translateY(-0.1em) rotate(45deg);
	}

	.title {
		font-size: clamp(1.625rem, 2.6vw, 2.375rem);
		font-weight: 400;
		letter-spacing: -0.04em;
		line-height: 1.1;
	}

	.org {
		color: var(--ink);
		opacity: 0.8;
	}

	.summary {
		color: var(--muted);
		max-width: 48ch;
	}

	.stage-col {
		grid-column: 2;
		grid-row: 1;
	}

	.stage {
		position: sticky;
		top: 0;
		height: 100svh;
		opacity: 0;
		transition: opacity 1.2s var(--ease-out);
	}

	.stage.ready {
		opacity: 1;
	}

	.stage :global(canvas) {
		display: block;
		width: 100%;
		height: 100%;
	}

	.formula,
	.sum {
		position: absolute;
		color: var(--muted);
		pointer-events: none;
	}

	.formula {
		top: 20%;
		left: 4%;
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.9375rem;
	}

	.int {
		font-family: var(--font-sans);
		font-size: 3rem;
		font-weight: 300;
		line-height: 1;
		color: var(--ink);
	}

	.bounds {
		display: grid;
		gap: 1.1rem;
		font-size: 0.6875rem;
		line-height: 1;
	}

	.upper {
		color: var(--accent);
	}

	.sum {
		bottom: 22%;
		right: 4%;
		font-variant-numeric: tabular-nums;
	}

	.sum span {
		color: var(--ink);
	}

	/* Narrow screens: the stage pins below the nav and the list scrolls beneath it. */
	@media (max-width: 1023px) {
		.body {
			grid-template-columns: minmax(0, 1fr);
			gap: 0;
		}

		.stage-col {
			grid-column: 1;
			grid-row: 1;
			position: sticky;
			top: 64px;
			z-index: 1;
			height: 44svh;
			margin-inline: calc(var(--gutter) * -1);
			background: linear-gradient(var(--bg) 88%, transparent);
		}

		.stage {
			position: relative;
			height: 100%;
		}

		.formula {
			top: 8%;
		}

		.sum {
			bottom: 16%;
		}

		.entries {
			grid-row: 2;
			padding-block: 4svh 20svh;
		}

		.entry {
			min-height: 52svh;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.text {
			opacity: 1;
			transform: none;
		}
	}
</style>
