<!--
	Experience, drawn as a river. The line meanders from stage to stage and is drawn as you
	scroll; each stage lights up the moment the current reaches it. It ends on an open node,
	because no one steps in the same river twice and the next stretch is not written yet.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { gsap } from 'gsap';
	import { ScrollTrigger } from 'gsap/ScrollTrigger';
	import { experience, experienceEnd } from '$lib/content';
	import { reveal } from '$lib/motion/reveal';
	import Figure from '../Figure.svelte';

	let track: HTMLDivElement;
	let bed: SVGPathElement;
	let flow: SVGPathElement;
	let svgHeight = $state(0);

	// The richest stage starts open; the others open on request.
	let open = $state(new Set(experience.flatMap((s, i) => (s.open ? [i] : []))));

	function toggle(i: number) {
		const next = new Set(open);
		if (next.has(i)) next.delete(i);
		else next.add(i);
		open = next;
	}

	onMount(() => {
		gsap.registerPlugin(ScrollTrigger);
		const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
		let length = 0;
		let progress = reduce ? 1 : 0;

		// Thread a meandering path through every node, bending alternately left and right.
		const draw = () => {
			const box = track.getBoundingClientRect();
			const nodes = [...track.querySelectorAll<HTMLElement>('.node')].map((n) => {
				const r = n.getBoundingClientRect();
				return { x: r.left + r.width / 2 - box.left, y: r.top + r.height / 2 - box.top };
			});
			if (nodes.length < 2) return;
			svgHeight = box.height;
			let d = `M ${nodes[0].x} 0 L ${nodes[0].x} ${nodes[0].y}`;
			for (let i = 1; i < nodes.length; i++) {
				const a = nodes[i - 1];
				const b = nodes[i];
				const bend = (i % 2 ? 1 : -1) * Math.min(28, (b.y - a.y) * 0.18);
				const third = (b.y - a.y) / 3;
				d += ` C ${a.x + bend} ${a.y + third}, ${b.x + bend} ${b.y - third}, ${b.x} ${b.y}`;
			}
			bed.setAttribute('d', d);
			flow.setAttribute('d', d);
			length = flow.getTotalLength();
			flow.style.strokeDasharray = `${length}`;
			flow.style.strokeDashoffset = `${length * (1 - progress)}`;
		};

		draw();
		const ro = new ResizeObserver(() => {
			draw();
			ScrollTrigger.refresh();
		});
		ro.observe(track);

		if (reduce) {
			track.querySelectorAll('.stage').forEach((s) => s.classList.add('passed'));
			return () => ro.disconnect();
		}

		const triggers: ScrollTrigger[] = [
			ScrollTrigger.create({
				trigger: track,
				start: 'top 65%',
				end: 'bottom 65%',
				scrub: 0.6,
				onUpdate: (self) => {
					progress = self.progress;
					flow.style.strokeDashoffset = `${length * (1 - progress)}`;
				}
			})
		];
		// Passed once the current reaches a node, and only un-passed by scrolling back above it, so
		// the state follows scroll position and survives fast jumps (anchor links, restored scroll).
		// Nothing depends on where the page ends, which the Work pin further down would shift.
		track.querySelectorAll<HTMLElement>('.stage').forEach((stage) => {
			const set = (on: boolean) => () => stage.classList.toggle('passed', on);
			triggers.push(
				ScrollTrigger.create({
					trigger: stage.querySelector('.node'),
					start: 'center 65%',
					end: 'max',
					onEnter: set(true),
					onLeaveBack: set(false),
					onRefresh: (self) => stage.classList.toggle('passed', self.progress > 0)
				})
			);
		});

		return () => {
			ro.disconnect();
			triggers.forEach((t) => t.kill());
		};
	});
</script>

<section id="experience" class="experience wrap seam" aria-labelledby="experience-title" data-field="fall" data-label="Experience">
	<header class="head">
		<h2 id="experience-title" class="heading" data-reveal="lines" use:reveal>
			<span class="line-mask"><span class="line">Experience</span></span>
		</h2>
		<p class="lede" data-reveal use:reveal={{ delay: 150 }}>
			Every stage below happened once, and will not happen the same way again.
		</p>
	</header>

	<div class="track" bind:this={track}>
		<svg class="river" width="100%" height={svgHeight} aria-hidden="true">
			<!-- The current is river-coloured and warms into the accent as it reaches the present. -->
			<defs>
				<linearGradient id="experience-current" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={svgHeight}>
					<stop offset="0" style="stop-color: var(--river)" />
					<stop offset="0.62" style="stop-color: var(--river)" />
					<stop offset="0.9" style="stop-color: var(--accent)" />
				</linearGradient>
			</defs>
			<path class="bed" bind:this={bed} />
			<path class="flow" bind:this={flow} />
		</svg>

		<ol class="stages">
			{#each experience as stage, i (stage.id)}
				<li class="stage" class:now={stage.now} id={stage.id}>
					<p class="when">
						<span class="date mono">{stage.date}</span>
						<span class="kind label">{stage.kind}</span>
						{#if stage.now}<span class="live label">Now</span>{/if}
					</p>
					<span class="node" aria-hidden="true"></span>

					<div class="content" data-reveal use:reveal>
						<h3 class="title">{stage.title}</h3>
						<p class="org">{stage.org}</p>
						<p class="summary">{stage.summary}</p>

						{#if stage.points}
							<button
								class="more label"
								aria-expanded={open.has(i)}
								aria-controls="stage-{i}"
								onclick={() => toggle(i)}
							>
								{open.has(i) ? 'Less' : 'What I did'}
							</button>
							<div class="points" class:open={open.has(i)} id="stage-{i}">
								<ul>
									{#each stage.points as point (point)}
										<li><Figure text={point} /></li>
									{/each}
								</ul>
							</div>
						{/if}
					</div>
				</li>
			{/each}

			<li class="stage end">
				<p class="when"><span class="date mono">{experienceEnd.date}</span></p>
				<span class="node" aria-hidden="true"></span>
				<div class="content" data-reveal use:reveal>
					<h3 class="title">{experienceEnd.title}</h3>
					<p class="summary">{experienceEnd.summary}</p>
				</div>
			</li>
		</ol>
	</div>
</section>

<style>
	.experience {
		padding-block: clamp(6rem, 14vh, 9rem);
	}

	.head {
		display: grid;
		gap: 1.25rem;
		margin-bottom: clamp(3.5rem, 9vh, 6rem);
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

	.track {
		position: relative;
		--date-col: minmax(0, 2fr);
		--node-col: 3rem;
	}

	.river {
		position: absolute;
		inset: 0 0 auto 0;
		pointer-events: none;
		overflow: visible;
	}

	.river path {
		fill: none;
		stroke-width: 1.25;
	}

	.bed {
		stroke: var(--line);
	}

	.flow {
		stroke: url(#experience-current);
	}

	.stages {
		position: relative;
		display: grid;
		gap: clamp(3rem, 8vh, 5rem);
	}

	.stage {
		display: grid;
		grid-template-columns: var(--date-col) var(--node-col) minmax(0, 8fr);
		align-items: start;
		column-gap: clamp(1rem, 3vw, 2.5rem);
		/* Room for the nav when a stage is jumped to (Toolkit links here). */
		scroll-margin-top: 6rem;
	}

	/* Metadata column: when, what kind, and whether it is still running. */
	.when {
		display: grid;
		justify-items: end;
		align-content: start;
		gap: 0.3rem;
		padding-top: 0.35rem;
		text-align: right;
	}

	.date {
		color: var(--muted);
		transition: color 0.5s var(--ease-out);
	}

	.kind {
		color: var(--muted);
	}

	.node {
		justify-self: center;
		width: 13px;
		height: 13px;
		margin-top: 0.4rem;
		border: 1px solid var(--muted);
		background: var(--bg);
		transform: rotate(45deg) scale(0.8);
		transition:
			background-color 0.5s var(--ease-out),
			border-color 0.5s var(--ease-out),
			transform 0.7s var(--ease-out);
	}

	/* Passed stages take the river's colour; stages still running take the accent. */
	.stage:global(.passed) .node {
		background: var(--river);
		border-color: var(--river);
		transform: rotate(45deg) scale(1);
	}

	.stage.now:global(.passed) .node {
		background: var(--accent);
		border-color: var(--accent);
	}

	.stage:global(.passed) .date {
		color: var(--ink);
	}

	.stage.end .node {
		background: var(--bg);
		border-style: dashed;
	}

	.content {
		display: grid;
		gap: 0.6rem;
		max-width: 60rem;
	}

	/* "Now" marks a stage that is still running: real state, so it gets the one live dot. */
	.live {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		color: var(--accent);
	}

	.live::before {
		content: '';
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: currentColor;
		animation: pulse 2.4s var(--ease-out) infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.25;
		}
	}

	.title {
		font-size: clamp(1.625rem, 3vw, 2.625rem);
		font-weight: 400;
		letter-spacing: -0.04em;
		line-height: 1.08;
	}

	.org {
		color: var(--ink);
		opacity: 0.8;
	}

	.summary {
		color: var(--muted);
		max-width: 56ch;
	}

	.stage.end .title {
		font-style: italic;
		font-weight: 300;
	}

	.more {
		justify-self: start;
		margin-top: 0.4rem;
		color: var(--accent);
		border-bottom: 1px solid currentColor;
		padding-bottom: 0.15rem;
	}

	.points {
		display: grid;
		grid-template-rows: 0fr;
		transition: grid-template-rows 0.7s var(--ease-out);
	}

	.points ul {
		overflow: hidden;
		display: grid;
		gap: 0.85rem;
		max-width: 64ch;
	}

	.points.open {
		grid-template-rows: 1fr;
	}

	.points li {
		position: relative;
		padding-left: 1.25rem;
		line-height: 1.6;
	}

	.points li::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0.8em;
		width: 0.6rem;
		height: 1px;
		background: var(--accent);
	}

	.points.open ul {
		padding-top: 0.6rem;
	}

	@media (max-width: 767px) {
		.stage {
			grid-template-columns: 2rem minmax(0, 1fr);
			column-gap: 1rem;
		}

		.when {
			grid-column: 2;
			grid-row: 1;
			display: flex;
			flex-wrap: wrap;
			gap: 0.4rem 0.9rem;
			text-align: left;
			padding-top: 0;
			margin-bottom: 0.4rem;
		}

		.node {
			grid-column: 1;
			grid-row: 1;
			margin-top: 0.3rem;
		}

		.content {
			grid-column: 2;
		}

	}

	@media (prefers-reduced-motion: reduce) {
		.live::before {
			animation: none;
		}
	}
</style>
