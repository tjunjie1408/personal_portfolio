<!--
	Runs one project drawing on a canvas. Colours come from the page tokens (re-read when the
	theme flips), the loop stops while offscreen, hovering the surrounding card speeds it up, and
	reduced motion shows a single settled frame.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { sketches, type Palette, type SketchKind } from '$lib/sketches';
	import { theme } from '$lib/theme.svelte';

	type Props = { kind: SketchKind };
	let { kind }: Props = $props();

	let canvas: HTMLCanvasElement;
	let palette: Palette | null = null;

	const readPalette = (): Palette => {
		const css = getComputedStyle(document.documentElement);
		const v = (name: string) => css.getPropertyValue(name).trim();
		return { ink: v('--ink'), muted: v('--muted'), line: v('--line'), accent: v('--accent'), bg: v('--bg-raised') };
	};

	$effect(() => {
		void theme.current;
		if (palette) palette = readPalette();
	});

	onMount(() => {
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		palette = readPalette();
		const sketch = sketches[kind](ctx);
		const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

		const resize = () => {
			const { width, height } = canvas.getBoundingClientRect();
			const dpr = Math.min(window.devicePixelRatio || 1, 2);
			canvas.width = Math.max(1, width * dpr);
			canvas.height = Math.max(1, height * dpr);
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			sketch.resize(width, height);
		};
		resize();

		// Settle the simulation, so even a single frame shows the drawing mid-story.
		for (let i = 0; i < 360; i++) sketch.frame(1 / 60, palette, 1);

		const ro = new ResizeObserver(() => {
			resize();
			sketch.frame(0, palette!, 1);
		});
		ro.observe(canvas);
		if (reduce) return () => ro.disconnect();

		// Hovering the card the drawing lives in makes it work harder.
		let target = 1;
		let speed = 1;
		const card = canvas.closest('button, a') ?? canvas;
		const on = () => (target = 2.2);
		const off = () => (target = 1);
		card.addEventListener('pointerenter', on);
		card.addEventListener('pointerleave', off);

		let raf = 0;
		let last = performance.now();
		const loop = (t: number) => {
			const dt = Math.min((t - last) / 1000, 0.05);
			last = t;
			speed += (target - speed) * Math.min(1, dt * 4);
			sketch.frame(dt, palette!, speed);
			raf = requestAnimationFrame(loop);
		};
		const io = new IntersectionObserver(([entry]) => {
			cancelAnimationFrame(raf);
			if (entry.isIntersecting) {
				last = performance.now();
				raf = requestAnimationFrame(loop);
			}
		});
		io.observe(canvas);

		return () => {
			cancelAnimationFrame(raf);
			io.disconnect();
			ro.disconnect();
			card.removeEventListener('pointerenter', on);
			card.removeEventListener('pointerleave', off);
		};
	});
</script>

<canvas bind:this={canvas} class="sketch" aria-hidden="true"></canvas>

<style>
	.sketch {
		display: block;
		width: 100%;
		height: 100%;
	}
</style>
