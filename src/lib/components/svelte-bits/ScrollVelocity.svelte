<!--
	Adapted from Svelte Bits "Scroll Velocity" (https://sveltebits.xyz).
	Reads velocity from the shared Lenis state instead of polling window.scrollY,
	pauses offscreen, and holds still under reduced motion.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { scroll } from '$lib/motion/scroll.svelte';

	type Props = {
		texts: string[];
		/** Base drift in px per second. */
		velocity?: number;
		/** How strongly scroll speed multiplies the drift. */
		boost?: number;
		copies?: number;
		/** Run the first row right-to-left instead of left-to-right. */
		reverse?: boolean;
	};

	let { texts, velocity = 40, boost = 0.12, copies = 4, reverse = false }: Props = $props();

	let root: HTMLDivElement;
	const copyEls: HTMLSpanElement[] = $state([]);
	const trackEls: HTMLDivElement[] = $state([]);

	const wrap = (min: number, max: number, v: number) => {
		const range = max - min;
		return ((((v - min) % range) + range) % range) + min;
	};

	onMount(() => {
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

		const baseX = texts.map(() => 0);
		const dir = texts.map(() => 1);
		let smooth = 0;
		let last = performance.now();
		let raf = 0;

		const tick = (t: number) => {
			const dt = Math.min((t - last) / 1000, 0.05);
			last = t;
			// Ease toward the current scroll velocity so direction changes feel weighted.
			smooth += (scroll.velocity - smooth) * 0.1;
			const factor = smooth * boost;

			texts.forEach((_, i) => {
				if (factor < -0.01) dir[i] = -1;
				else if (factor > 0.01) dir[i] = 1;
				const base = (i % 2 ? -velocity : velocity) * (reverse ? -1 : 1) * dir[i] * dt;
				baseX[i] += base + base * Math.abs(factor);
				const w = copyEls[i]?.offsetWidth ?? 0;
				if (w > 0) trackEls[i].style.transform = `translate3d(${wrap(-w, 0, baseX[i])}px,0,0)`;
			});
			raf = requestAnimationFrame(tick);
		};

		const io = new IntersectionObserver(([entry]) => {
			cancelAnimationFrame(raf);
			if (entry.isIntersecting) {
				last = performance.now();
				raf = requestAnimationFrame(tick);
			}
		});
		io.observe(root);

		return () => {
			cancelAnimationFrame(raf);
			io.disconnect();
		};
	});
</script>

<div bind:this={root} class="velocity">
	{#each texts as text, i (i)}
		<div class="row">
			<div class="track" bind:this={trackEls[i]}>
				{#each Array.from({ length: copies }, (_, j) => j) as j (j)}
					{#if j === 0}
						<span bind:this={copyEls[i]}>{text}&nbsp;</span>
					{:else}
						<span aria-hidden="true">{text}&nbsp;</span>
					{/if}
				{/each}
			</div>
		</div>
	{/each}
</div>

<style>
	.row {
		overflow: hidden;
	}

	.track {
		display: flex;
		white-space: nowrap;
		will-change: transform;
	}

	.track span {
		flex-shrink: 0;
	}
</style>
