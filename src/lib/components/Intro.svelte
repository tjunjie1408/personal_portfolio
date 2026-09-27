<!--
	Opening curtain: Heraclitus decodes letter by letter, then the curtain lifts.
	Plays once per session; app.html skips it under reduced motion or on a repeat visit.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { gsap } from 'gsap';
	import DecryptedText from './svelte-bits/DecryptedText.svelte';
	import { intro } from '$lib/motion/intro.svelte';
	import { lockScroll } from '$lib/motion/scroll.svelte';
	import { quotes } from '$lib/content';

	let el: HTMLDivElement;
	let active = $state(false);

	onMount(() => {
		const root = document.documentElement;
		if (!('intro' in root.dataset)) {
			intro.done = true;
			return;
		}
		active = true;
		lockScroll(true);
		try {
			sessionStorage.setItem('intro-seen', '1');
		} catch {
			// storage blocked: the intro simply plays again next time
		}
		return () => lockScroll(false);
	});

	function lift() {
		const root = document.documentElement;
		gsap
			.timeline({ delay: 0.5 })
			.to(el.querySelector('.rule'), { scaleX: 1, duration: 0.7, ease: 'power3.inOut' })
			.to(el, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.1, ease: 'expo.inOut' }, '+=0.1')
			.add(() => {
				intro.done = true;
			}, '-=0.55')
			.add(() => {
				delete root.dataset.intro;
				lockScroll(false);
				active = false;
			});
	}
</script>

<div bind:this={el} class="intro" aria-hidden="true">
	<p class="line">
		{#if active}
			<DecryptedText
				text={quotes.river.text}
				animateOn="view"
				sequential
				speed={28}
				characters="abcdefghijklmnopqrstuvwxyz"
				onDone={lift}
			/>
		{:else}
			{quotes.river.text}
		{/if}
	</p>
	<span class="rule"></span>
	<p class="cite label">Heraclitus</p>
</div>

<style>
	.intro {
		display: none;
	}

	:global(html.js[data-intro]) .intro {
		position: fixed;
		inset: 0;
		z-index: var(--z-intro);
		display: grid;
		place-content: center;
		gap: 1.5rem;
		padding: var(--gutter);
		background: var(--ink);
		color: var(--bg);
		clip-path: inset(0% 0% 0% 0%);
	}

	.line {
		display: flex;
		gap: 1.25rem;
		align-items: baseline;
		font-size: clamp(1.125rem, 2.4vw, 1.75rem);
		letter-spacing: -0.02em;
		max-width: 40ch;
	}

	.cite {
		opacity: 0.55;
	}

	.rule {
		display: block;
		height: 1px;
		background: currentColor;
		opacity: 0.35;
		transform: scaleX(0);
		transform-origin: left;
	}
</style>
