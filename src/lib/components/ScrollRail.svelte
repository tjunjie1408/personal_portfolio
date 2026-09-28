<!--
	Stands in for the native scrollbar on fine pointers. A hairline down the right edge with one
	tick per section; the river-coloured fill is how far you have read, and the accent diamond is
	where you are. It rests almost invisible and wakes while you scroll or hover. The section you
	are in is named beside its tick. Click a tick to jump, or drag anywhere on the rail.
	Touch screens keep the top hairline instead (see +layout.svelte).
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { gsap } from 'gsap';
	import { ScrollTrigger } from 'gsap/ScrollTrigger';
	import { scroll, scrollToTarget } from '$lib/motion/scroll.svelte';

	type Mark = { label: string; at: number; el: HTMLElement };

	let rail: HTMLDivElement;
	let marks = $state<Mark[]>([]);
	let progress = $state(0);
	let awake = $state(false);
	let dragging = $state(false);

	const current = $derived.by(() => {
		let i = 0;
		marks.forEach((m, j) => {
			if (progress + 0.002 >= m.at) i = j;
		});
		return i;
	});

	const maxScroll = () => ScrollTrigger.maxScroll(window);

	// Wake on movement, sleep after a pause.
	let sleep = 0;
	$effect(() => {
		if (Math.abs(scroll.velocity) < 0.4) return;
		awake = true;
		clearTimeout(sleep);
		sleep = window.setTimeout(() => (awake = false), 1100);
	});

	onMount(() => {
		gsap.registerPlugin(ScrollTrigger);

		// Section starts as fractions of the scrollable height. A pinned section is measured by its
		// spacer, which is where its scroll distance actually begins.
		const measure = () => {
			const max = maxScroll() || 1;
			marks = [...document.querySelectorAll<HTMLElement>('[data-label]')].map((el) => {
				const box = (el.parentElement?.classList.contains('pin-spacer') ? el.parentElement : el) as HTMLElement;
				const top = box.getBoundingClientRect().top + window.scrollY;
				return { label: el.dataset.label ?? '', at: Math.min(1, Math.max(0, top / max)), el };
			});
		};

		const st = ScrollTrigger.create({
			start: 0,
			end: 'max',
			onUpdate: (self) => (progress = self.progress)
		});
		ScrollTrigger.addEventListener('refresh', measure);
		const first = requestAnimationFrame(measure);

		return () => {
			cancelAnimationFrame(first);
			clearTimeout(sleep);
			st.kill();
			ScrollTrigger.removeEventListener('refresh', measure);
		};
	});

	const seek = (e: PointerEvent) => {
		const r = rail.getBoundingClientRect();
		const p = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
		scrollToTarget(p * maxScroll(), { follow: true });
	};

	function down(e: PointerEvent) {
		if (e.button !== 0) return;
		// Ticks handle their own click; the rest of the rail is a drag surface.
		if ((e.target as HTMLElement).closest('.tick')) return;
		dragging = true;
		rail.setPointerCapture(e.pointerId);
		seek(e);
	}

	function move(e: PointerEvent) {
		if (dragging) seek(e);
	}

	function up(e: PointerEvent) {
		dragging = false;
		if (rail.hasPointerCapture(e.pointerId)) rail.releasePointerCapture(e.pointerId);
	}

	function jump(m: Mark) {
		const box = m.el.parentElement?.classList.contains('pin-spacer') ? m.el.parentElement : m.el;
		scrollToTarget(box.getBoundingClientRect().top + window.scrollY);
	}
</script>

<div
	class="rail"
	class:awake={awake || dragging}
	class:dragging
	bind:this={rail}
	onpointerdown={down}
	onpointermove={move}
	onpointerup={up}
	onpointercancel={up}
	aria-hidden="true"
>
	<span class="track"></span>
	<span class="fill" style:transform="scaleY({progress})"></span>

	{#each marks as m, i (m.label)}
		<button
			class="tick"
			class:passed={progress + 0.002 >= m.at}
			class:here={i === current}
			style:top="{m.at * 100}%"
			tabindex="-1"
			onclick={() => jump(m)}
		>
			<span class="name mono">{m.label}</span>
		</button>
	{/each}

	<span class="thumb-track" style:transform="translateY({progress * 100}%)"><span class="thumb"></span></span>
</div>

<style>
	.rail {
		position: fixed;
		top: 50%;
		right: 0;
		z-index: var(--z-nav);
		width: 2.75rem;
		height: min(56vh, 30rem);
		transform: translateY(-50%);
		touch-action: none;
		cursor: pointer;
		opacity: 0.35;
		transition: opacity 0.6s var(--ease-out);
	}

	.rail:hover,
	.rail.awake {
		opacity: 1;
	}

	.dragging {
		cursor: grabbing;
	}

	.track,
	.fill {
		position: absolute;
		top: 0;
		bottom: 0;
		right: 1.25rem;
		width: 1px;
		background: var(--line);
	}

	.fill {
		background: var(--river);
		transform-origin: top;
	}

	.tick {
		position: absolute;
		right: 1.25rem;
		width: 0.5rem;
		height: 0.75rem;
		transform: translateY(-50%);
		display: flex;
		align-items: center;
		justify-content: flex-end;
	}

	/* The tick is drawn by the pseudo-element so the button can keep a comfortable hit area. */
	.tick::before {
		content: '';
		width: 100%;
		height: 1px;
		background: var(--muted);
		transform-origin: right;
		transition:
			transform 0.5s var(--ease-out),
			background-color 0.5s var(--ease-out);
	}

	.tick.passed::before {
		background: var(--river);
	}

	.tick.here::before,
	.tick:hover::before {
		transform: scaleX(1.8);
		background: var(--ink);
	}

	.name {
		position: absolute;
		right: calc(100% + 0.6rem);
		font-size: 0.6875rem;
		white-space: nowrap;
		color: var(--muted);
		opacity: 0;
		transform: translateX(0.4rem);
		transition:
			opacity 0.4s var(--ease-out),
			transform 0.5s var(--ease-out);
		pointer-events: none;
	}

	/* Names: the current one while awake, all of them while the pointer is on the rail. */
	.awake .here .name,
	.rail:hover .name {
		opacity: 1;
		transform: none;
	}

	.here .name {
		color: var(--ink);
	}

	/* Full rail height, so a percentage translate moves the thumb in rail units. */
	.thumb-track {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	.thumb {
		position: absolute;
		top: 0;
		right: calc(1.25rem - 3px);
		width: 7px;
		height: 7px;
		margin-top: -3.5px;
		background: var(--accent);
		transform: rotate(45deg);
		pointer-events: none;
	}

	/* Touch devices scroll by hand and keep the top hairline; no rail. */
	@media not all and (pointer: fine), (max-width: 767px) {
		.rail {
			display: none;
		}
	}
</style>
