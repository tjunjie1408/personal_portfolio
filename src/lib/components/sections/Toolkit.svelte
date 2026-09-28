<!--
	Skills, tied to evidence. Hover (or tap) a tool and the projects that used it rise into view,
	large and in full contrast. A tool with no project yet falls back to the role that used it.
-->
<script lang="ts">
	import { projects, roadmap, toolkit } from '$lib/content';
	import { reveal } from '$lib/motion/reveal';

	const roles = roadmap.filter((s) => s.tools?.length);

	let active = $state('Rust');

	const shown = $derived.by(() => {
		const hits = projects.filter((p) => p.tools.includes(active)).map((p) => p.title);
		if (hits.length) return hits;
		return roles.filter((r) => r.tools!.includes(active)).map((r) => `${r.title}, ${r.org.split(',')[0]}`);
	});
</script>

<section id="toolkit" class="toolkit wrap seam" aria-labelledby="toolkit-title" data-field="constellation" data-label="Toolkit">
	<h2 id="toolkit-title" class="heading" data-reveal="lines" use:reveal>
		<span class="line-mask"><span class="line">Toolkit</span></span>
	</h2>

	<div class="side" aria-live="polite">
		<p class="picked label">{active}</p>
		{#key active}
			<ul class="shown">
				{#each shown as name, i (name)}
					<li style:--i={i}>{name}</li>
				{/each}
			</ul>
		{/key}
	</div>

	<div class="groups">
		{#each toolkit as g, gi (g.group)}
			<div class="group" data-reveal use:reveal={{ delay: gi * 90 }}>
				<h3 class="group-name label">{g.group}</h3>
				<ul>
					{#each g.items as tool (tool)}
						<li>
							<button
								class="tool"
								class:on={active === tool}
								aria-pressed={active === tool}
								onmouseenter={() => (active = tool)}
								onfocus={() => (active = tool)}
								onclick={() => (active = tool)}
							>
								{tool}
							</button>
						</li>
					{/each}
				</ul>
			</div>
		{/each}
	</div>
</section>

<style>
	.toolkit {
		display: grid;
		grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
		grid-template-rows: auto 1fr;
		gap: 2rem clamp(2.5rem, 6vw, 6rem);
		padding-block: clamp(6rem, 14vh, 9rem);
	}

	.heading {
		grid-column: 1;
		grid-row: 1;
		font-size: clamp(3rem, 6vw, 5.5rem);
		font-weight: 400;
		letter-spacing: -0.04em;
		line-height: 1;
	}

	/* The answer: which projects used the tool. Sticky so it stays beside the list. */
	.side {
		grid-column: 1;
		grid-row: 2;
		position: sticky;
		top: 7rem;
		align-self: start;
		display: grid;
		gap: 1.25rem;
		padding-top: 1.5rem;
		border-top: 1px solid var(--accent);
	}

	.picked {
		color: var(--accent);
	}

	.shown {
		display: grid;
		gap: 0.9rem;
	}

	/* Hanging indent: wrapped names line up under the first word, not under the marker. */
	.shown li {
		position: relative;
		padding-left: 0.85em;
		font-size: clamp(1.75rem, 3vw, 2.75rem);
		letter-spacing: -0.04em;
		line-height: 1.05;
		color: var(--ink);
		animation: rise 0.7s var(--ease-out) both;
		animation-delay: calc(var(--i) * 70ms);
	}

	.shown li::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0.34em;
		width: 0.42em;
		height: 0.42em;
		background: var(--accent);
		transform: rotate(45deg) scale(0.7);
	}

	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(0.8rem);
			filter: blur(4px);
		}
	}

	.groups {
		grid-column: 2;
		grid-row: 1 / span 2;
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: clamp(2.5rem, 6vh, 3.5rem) clamp(1.5rem, 4vw, 3rem);
		align-content: start;
	}

	.group-name {
		color: var(--muted);
		font-weight: 400;
		padding-bottom: 0.9rem;
		margin-bottom: 0.5rem;
		border-bottom: 1px solid var(--line);
	}

	.group ul {
		display: grid;
		gap: 0.2rem;
	}

	.tool {
		display: block;
		width: 100%;
		padding: 0.4rem 0.7rem;
		margin-left: -0.7rem;
		text-align: left;
		font-size: clamp(1.25rem, 1.9vw, 1.625rem);
		letter-spacing: -0.03em;
		transition:
			background-color 0.3s var(--ease-out),
			color 0.3s var(--ease-out),
			transform 0.5s var(--ease-out);
	}

	.tool:hover {
		transform: translateX(0.3rem);
	}

	/* The selected tool is filled with the accent so it is impossible to miss. */
	.tool.on {
		background: var(--accent);
		color: var(--accent-ink);
		transform: translateX(0.5rem);
	}

	@media (prefers-reduced-motion: reduce) {
		.shown li {
			animation: none;
		}
	}

	@media (max-width: 899px) {
		.toolkit {
			grid-template-columns: 1fr;
			grid-template-rows: none;
		}

		.heading,
		.side,
		.groups {
			grid-column: 1;
			grid-row: auto;
		}

		/* On phones the answer rides along the bottom of the screen while the tools scroll past. */
		.side {
			order: 2;
			top: auto;
			bottom: 0;
			z-index: 1;
			gap: 0.5rem;
			margin-inline: calc(var(--gutter) * -1);
			padding: 0.9rem var(--gutter) 1rem;
			background: color-mix(in srgb, var(--bg) 92%, transparent);
			backdrop-filter: blur(8px);
		}

		.shown {
			gap: 0.3rem;
		}

		.shown li {
			font-size: 1.125rem;
		}
	}

	@media (max-width: 540px) {
		.groups {
			grid-template-columns: 1fr;
		}
	}
</style>
