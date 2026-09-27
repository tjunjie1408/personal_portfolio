<!--
	A project read in full: why it exists, what was built (numbered like the propositions),
	what came of it, and with what. A native <dialog>, so focus, Esc and the backdrop behave.
	The panel wipes in from the right; its contents rise in reading order.
-->
<script lang="ts">
	import { gsap } from 'gsap';
	import type { Project } from '$lib/content';
	import Cover from './Cover.svelte';
	import Figure from './Figure.svelte';
	import { lockScroll } from '$lib/motion/scroll.svelte';

	type Props = {
		projects: Project[];
		/** Index of the open project, or -1 when closed. */
		index: number;
		onchange: (index: number) => void;
	};

	let { projects, index, onchange }: Props = $props();

	let dialog: HTMLDialogElement;
	let panel: HTMLDivElement;
	let body: HTMLDivElement;
	let closing = false;

	const project = $derived(index >= 0 ? projects[index] : null);
	const next = $derived(index >= 0 ? projects[(index + 1) % projects.length] : null);
	const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

	function enterContents() {
		if (reduce()) return;
		gsap.fromTo(
			body.querySelectorAll('[data-rise]'),
			{ y: 28, opacity: 0 },
			{ y: 0, opacity: 1, duration: 0.9, ease: 'expo.out', stagger: 0.05, delay: 0.1 }
		);
	}

	// Open, switch or close in response to `index`.
	$effect(() => {
		if (!dialog) return;
		if (index >= 0 && !dialog.open) {
			dialog.showModal();
			lockScroll(true);
			body.scrollTop = 0;
			if (!reduce()) {
				gsap.fromTo(
					panel,
					{ clipPath: 'inset(0% 0% 0% 100%)' },
					{ clipPath: 'inset(0% 0% 0% 0%)', duration: 1, ease: 'expo.inOut' }
				);
			}
			enterContents();
		} else if (index >= 0) {
			body.scrollTop = 0;
			enterContents();
		} else if (dialog.open) {
			finishClose();
		}
	});

	function requestClose() {
		if (closing) return;
		closing = true;
		if (reduce()) {
			onchange(-1);
			return;
		}
		gsap.to(panel, {
			clipPath: 'inset(0% 0% 0% 100%)',
			duration: 0.7,
			ease: 'expo.in',
			onComplete: () => onchange(-1)
		});
	}

	function finishClose() {
		dialog.close();
		lockScroll(false);
		closing = false;
		gsap.set(panel, { clearProps: 'clipPath' });
	}

	function onCancel(e: Event) {
		// Esc: animate out instead of vanishing.
		e.preventDefault();
		requestClose();
	}

	function onBackdrop(e: MouseEvent) {
		if (e.target === dialog) requestClose();
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
<dialog
	bind:this={dialog}
	class="case"
	aria-labelledby="case-title"
	oncancel={onCancel}
	onclick={onBackdrop}
>
	<div class="panel" bind:this={panel}>
		<div class="bar">
			<span class="label muted">{project?.kind}</span>
			<span class="bar-end">
				<span class="mono muted">{index + 1} / {projects.length}</span>
				<button class="label close" onclick={requestClose}>Close</button>
			</span>
		</div>

		<div class="body" bind:this={body} data-lenis-prevent>
			{#if project}
				<figure class="banner" data-rise>
					<Cover {project} eager />
				</figure>

				<div class="grid">
					<div class="intro">
						<h2 id="case-title" class="title" data-rise>{project.title}</h2>
						<p class="context" data-rise>{project.context}</p>

						<ul class="outcomes">
							{#each project.outcomes as o (o)}
								<li data-rise><Figure text={o} /></li>
							{/each}
						</ul>
					</div>

					<div class="detail">
						<h3 class="label muted" data-rise>What I built</h3>
						<ol class="steps">
							{#each project.approach as step, i (step)}
								<li data-rise>
									<span class="n mono">{index + 1}.{i + 1}</span>
									<span>{step}</span>
								</li>
							{/each}
						</ol>

						<h3 class="label muted" data-rise>Built with</h3>
						<ul class="tools" data-rise>
							{#each project.tools as tool (tool)}
								<li>{tool}</li>
							{/each}
						</ul>

						<a class="source" href={project.href} target="_blank" rel="noreferrer" data-rise>
							Source on GitHub
						</a>
					</div>
				</div>

				{#if next}
					<button class="next" onclick={() => onchange((index + 1) % projects.length)} data-rise>
						<span class="label muted">Next case</span>
						<span class="next-title">{next.title}</span>
					</button>
				{/if}
			{/if}
		</div>
	</div>
</dialog>

<style>
	.case {
		position: fixed;
		inset: 0;
		width: 100%;
		max-width: none;
		height: 100%;
		max-height: none;
		margin: 0;
		padding: 0;
		border: 0;
		background: transparent;
		color: var(--ink);
		overflow: hidden;
	}

	.case::backdrop {
		background: rgb(0 0 0 / 0.45);
		backdrop-filter: blur(2px);
	}

	.panel {
		position: absolute;
		inset: 0 0 0 auto;
		width: min(1180px, 94vw);
		display: grid;
		grid-template-rows: auto 1fr;
		background: var(--bg);
		border-left: 1px solid var(--line);
	}

	.bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		height: 64px;
		padding-inline: clamp(1.25rem, 4vw, 3rem);
		border-bottom: 1px solid var(--line);
	}

	.bar-end {
		display: flex;
		align-items: center;
		gap: 1.5rem;
	}

	.close:hover {
		color: var(--accent);
	}

	.muted {
		color: var(--muted);
	}

	.body {
		overflow-y: auto;
		overscroll-behavior: contain;
		padding: clamp(1.25rem, 4vw, 3rem);
	}

	.banner {
		width: 100%;
		aspect-ratio: 16 / 9;
		max-height: 58vh;
		overflow: hidden;
		background: var(--bg-raised);
	}


	.grid {
		display: grid;
		grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
		gap: clamp(2rem, 5vw, 5rem);
		padding-top: clamp(2rem, 5vh, 3.5rem);
	}

	.intro,
	.detail {
		display: grid;
		align-content: start;
		gap: 1.5rem;
	}

	.title {
		font-size: clamp(2.25rem, 4.4vw, 4rem);
		font-weight: 400;
		line-height: 1;
		letter-spacing: -0.045em;
	}

	.context {
		font-size: 1.125rem;
		line-height: 1.55;
		max-width: 42ch;
	}

	/* Results read as sentences; the figure inside each one carries the accent. */
	.outcomes {
		display: grid;
		gap: 0.9rem;
		margin-top: 0.75rem;
		padding-top: 1.25rem;
		border-top: 1px solid var(--line);
		font-size: 1.0625rem;
		line-height: 1.5;
		max-width: 42ch;
	}

	h3 {
		font-weight: 400;
	}

	.steps {
		display: grid;
		gap: 1.25rem;
	}

	.steps li {
		display: grid;
		grid-template-columns: 2.75rem 1fr;
		gap: 1rem;
		line-height: 1.55;
	}

	.steps .n {
		color: var(--accent);
		padding-top: 0.2em;
	}

	.tools {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.tools li {
		padding: 0.35rem 0.75rem;
		border: 1px solid var(--line);
		font-size: 0.875rem;
	}

	.source {
		justify-self: start;
		margin-top: 0.5rem;
		padding-bottom: 0.2rem;
		border-bottom: 1px solid currentColor;
		transition: color 0.3s var(--ease-out);
	}

	.source:hover {
		color: var(--accent);
	}

	.next {
		width: 100%;
		display: grid;
		gap: 0.5rem;
		margin-top: clamp(3rem, 8vh, 5rem);
		padding-top: 2rem;
		border-top: 1px solid var(--line);
		text-align: left;
	}

	.next-title {
		font-size: clamp(1.75rem, 3.4vw, 3rem);
		letter-spacing: -0.04em;
		transition:
			color 0.4s var(--ease-out),
			transform 0.7s var(--ease-out);
	}

	.next:hover .next-title {
		color: var(--accent);
		transform: translateX(1rem);
	}

	@media (max-width: 767px) {
		.panel {
			width: 100vw;
			border-left: 0;
		}

		.grid {
			grid-template-columns: 1fr;
		}

		.banner {
			aspect-ratio: 16 / 10;
		}
	}
</style>
