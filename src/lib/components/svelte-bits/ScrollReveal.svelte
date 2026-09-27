<!--
	Adapted from Svelte Bits "Scroll Reveal" (https://sveltebits.xyz).
	Words move from faint and blurred to solid as the paragraph is scrolled through,
	so the sentence is read at the pace it is revealed. Static under reduced motion.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { gsap } from 'gsap';
	import { ScrollTrigger } from 'gsap/ScrollTrigger';

	type Props = {
		text: string;
		baseOpacity?: number;
		baseRotation?: number;
		blurStrength?: number;
	};

	let { text, baseOpacity = 0.12, baseRotation = 2, blurStrength = 6 }: Props = $props();

	let el: HTMLParagraphElement;
	const parts = $derived(text.split(/(\s+)/));

	onMount(() => {
		gsap.registerPlugin(ScrollTrigger);
		const mm = gsap.matchMedia();
		mm.add('(prefers-reduced-motion: no-preference)', () => {
			const words = el.querySelectorAll('.word');
			gsap.fromTo(
				el,
				{ transformOrigin: '0% 50%', rotate: baseRotation },
				{ rotate: 0, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom 60%', scrub: true } }
			);
			gsap.fromTo(
				words,
				{ opacity: baseOpacity, filter: `blur(${blurStrength}px)` },
				{
					opacity: 1,
					filter: 'blur(0px)',
					ease: 'none',
					stagger: 0.05,
					scrollTrigger: { trigger: el, start: 'top 85%', end: 'bottom 55%', scrub: true }
				}
			);
		});
		return () => mm.revert();
	});
</script>

<p bind:this={el} class="scroll-reveal">
	{#each parts as part, i (i)}{#if /^\s+$/.test(part)}{part}{:else}<span class="word">{part}</span>{/if}{/each}
</p>

<style>
	.word {
		display: inline-block;
	}
</style>
