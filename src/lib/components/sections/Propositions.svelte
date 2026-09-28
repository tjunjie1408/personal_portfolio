<!--
	Principles, written as numbered propositions. While pinned, scrolling steps through them
	one at a time, so each claim gets the full stage before the next replaces it.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { gsap } from 'gsap';
	import { ScrollTrigger } from 'gsap/ScrollTrigger';
	import { propositions } from '$lib/content';

	let root: HTMLElement;
	let pinned = $state(false);
	let active = $state(0);
	let subOn = $state(false);
	let progress = $state(0);

	const count = propositions.length;

	onMount(() => {
		gsap.registerPlugin(ScrollTrigger);
		const mm = gsap.matchMedia();
		mm.add('(prefers-reduced-motion: no-preference)', () => {
			pinned = true;
			// Wait a frame for the tall pinned layout before measuring.
			let st: ScrollTrigger | undefined;
			const id = requestAnimationFrame(() => {
				st = ScrollTrigger.create({
					trigger: root,
					start: 'top top',
					end: 'bottom bottom',
					onUpdate: (self) => {
						const p = self.progress * count;
						active = Math.min(count - 1, Math.floor(p));
						subOn = p - active > 0.3;
						progress = self.progress;
					}
				});
				ScrollTrigger.refresh();
			});
			return () => {
				cancelAnimationFrame(id);
				st?.kill();
				pinned = false;
			};
		});
		return () => mm.revert();
	});

	const phase = (i: number) => (i < active ? 'past' : i === active ? 'now' : 'next');
</script>

<section
	id="principles"
	class="props seam"
	data-field="lattice"
	data-label="Principles"
	class:pinned
	bind:this={root}
	style:--count={count}
	aria-label="Principles"
>
	<div class="stage wrap">
		{#if pinned}
			<div class="numeral" aria-hidden="true">
				{#each propositions as p, i (p.n)}
					<span class="digit {phase(i)}">{p.n}</span>
				{/each}
			</div>

			<ol class="claims">
				{#each propositions as p, i (p.n)}
					<li class="claim {phase(i)}" class:sub-on={i === active && subOn} aria-current={i === active}>
						<span class="line-mask"><span class="line text">{p.claim}</span></span>
						<span class="sub"><span class="mono">{p.n}.1</span>{p.sub}</span>
					</li>
				{/each}
			</ol>

			<div class="rail" aria-hidden="true">
				<span class="fill" style:transform="scaleX({progress})"></span>
				{#each propositions as p, i (p.n)}
					<span class="tick mono" class:on={i <= active}>{p.n}</span>
				{/each}
			</div>
		{:else}
			<ol class="static-list">
				{#each propositions as p (p.n)}
					<li>
						<span class="mono n">{p.n}</span>
						<p class="text">{p.claim}</p>
						<p class="static-sub"><span class="mono">{p.n}.1</span> {p.sub}</p>
					</li>
				{/each}
			</ol>
		{/if}
	</div>
</section>

<style>
	.props {
		position: relative;
	}

	.props.pinned {
		height: calc(100dvh * (var(--count) * 0.6 + 1));
	}

	.pinned .stage {
		position: sticky;
		top: 0;
		height: 100dvh;
		display: grid;
		grid-template-columns: repeat(12, minmax(0, 1fr));
		grid-template-rows: 1fr auto;
		align-items: center;
		gap: 2rem;
		padding-block: 6rem 2.5rem;
	}

	.numeral {
		grid-column: 1 / span 5;
		position: relative;
		height: 1em;
		font-size: clamp(9rem, 26vw, 24rem);
		font-weight: 200;
		line-height: 1;
		letter-spacing: -0.04em;
		overflow: hidden;
	}

	.digit {
		position: absolute;
		inset: 0;
		transition:
			transform 1.1s var(--ease-out),
			opacity 1.1s var(--ease-out);
	}

	.digit.past {
		transform: translateY(-100%);
		opacity: 0;
	}

	.digit.next {
		transform: translateY(100%);
		opacity: 0;
	}

	.claims {
		grid-column: 6 / -1;
		position: relative;
		align-self: center;
		min-height: 14rem;
	}

	.claim {
		position: absolute;
		inset: 0 0 auto;
		display: grid;
		gap: 1.75rem;
		pointer-events: none;
	}

	.text {
		font-size: clamp(2rem, 4.6vw, 4.25rem);
		line-height: 1.06;
		letter-spacing: -0.04em;
	}

	.claim .line {
		transform: translateY(110%);
		transition: transform 1s var(--ease-out);
	}

	.claim.now .line {
		transform: none;
		transition-delay: 0.12s;
	}

	.claim.past .line {
		transform: translateY(-110%);
	}

	.sub {
		display: flex;
		gap: 1.25rem;
		align-items: baseline;
		max-width: 38ch;
		color: var(--muted);
		font-size: 1.125rem;
		opacity: 0;
		transform: translateY(0.75rem);
		transition:
			opacity 0.8s var(--ease-out),
			transform 0.8s var(--ease-out);
	}

	.sub .mono {
		color: var(--accent);
	}

	.claim.sub-on .sub {
		opacity: 1;
		transform: none;
	}

	.rail {
		grid-column: 1 / -1;
		position: relative;
		display: flex;
		justify-content: space-between;
		padding-top: 1rem;
		color: var(--muted);
	}

	.rail::before,
	.fill {
		content: '';
		position: absolute;
		inset: 0 0 auto;
		height: 1px;
		background: var(--line);
	}

	.fill {
		background: var(--accent);
		transform-origin: left;
	}

	.tick {
		transition: color 0.5s var(--ease-out);
	}

	.tick.on {
		color: var(--ink);
	}

	/* Reduced motion, or before hydration: a plain readable list. */
	.static-list {
		display: grid;
		gap: 4rem;
		padding-block: 8rem;
	}

	.static-list li {
		display: grid;
		gap: 1rem;
	}

	.static-list .n,
	.static-sub .mono {
		color: var(--accent);
	}

	.static-sub {
		color: var(--muted);
		max-width: 40ch;
	}

	@media (max-width: 767px) {
		.pinned .stage {
			grid-template-columns: 1fr;
			grid-template-rows: auto 1fr auto;
			align-items: start;
			padding-top: 5.5rem;
		}

		.numeral,
		.claims {
			grid-column: 1 / -1;
		}

		.numeral {
			font-size: clamp(7rem, 40vw, 11rem);
		}
	}
</style>
