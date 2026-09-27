<!--
	Adapted from Svelte Bits "Magnet" (https://sveltebits.xyz).
	Uses gsap.quickTo instead of reactive state so pointer tracking never touches rendering,
	and stays inert on touch devices and under reduced motion.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';
	import { gsap } from 'gsap';

	type Props = { children: Snippet; padding?: number; strength?: number };

	let { children, padding = 80, strength = 3 }: Props = $props();

	let outer: HTMLSpanElement;
	let inner: HTMLSpanElement;

	onMount(() => {
		const fine = matchMedia('(pointer: fine)').matches;
		const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (!fine || reduce) return;

		const toX = gsap.quickTo(inner, 'x', { duration: 0.6, ease: 'power3.out' });
		const toY = gsap.quickTo(inner, 'y', { duration: 0.6, ease: 'power3.out' });

		const onMove = (e: PointerEvent) => {
			const { left, top, width, height } = outer.getBoundingClientRect();
			const cx = left + width / 2;
			const cy = top + height / 2;
			const inside =
				Math.abs(cx - e.clientX) < width / 2 + padding && Math.abs(cy - e.clientY) < height / 2 + padding;
			toX(inside ? (e.clientX - cx) / strength : 0);
			toY(inside ? (e.clientY - cy) / strength : 0);
		};

		window.addEventListener('pointermove', onMove, { passive: true });
		return () => {
			window.removeEventListener('pointermove', onMove);
			gsap.killTweensOf(inner);
		};
	});
</script>

<span bind:this={outer} class="magnet">
	<span bind:this={inner} class="magnet-inner">{@render children()}</span>
</span>

<style>
	.magnet {
		position: relative;
		display: inline-block;
	}

	.magnet-inner {
		display: inline-block;
		will-change: transform;
	}
</style>
