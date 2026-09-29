<script lang="ts">
	import '@fontsource-variable/geist';
	import '@fontsource-variable/geist/wght-italic.css';
	import '@fontsource-variable/geist-mono';
	import 'lenis/dist/lenis.css';
	import '../app.css';

	import { onMount } from 'svelte';
	import { gsap } from 'gsap';
	import { ScrollTrigger } from 'gsap/ScrollTrigger';
	import favicon from '$lib/assets/favicon.svg';
	import Drift from '$lib/components/Drift.svelte';
	import Intro from '$lib/components/Intro.svelte';
	import Nav from '$lib/components/Nav.svelte';
	import ScrollRail from '$lib/components/ScrollRail.svelte';
	import { site } from '$lib/content';
	import { watchField } from '$lib/motion/field.svelte';
	import { initSmoothScroll, scrollToTarget } from '$lib/motion/scroll.svelte';
	import { syncTheme } from '$lib/theme.svelte';

	let { children } = $props();
	let bar: HTMLSpanElement;

	onMount(() => {
		gsap.registerPlugin(ScrollTrigger);
		syncTheme();
		const stopScroll = initSmoothScroll();
		const stopField = watchField();

		// Reading position, as a hairline across the top (touch screens; fine pointers get the rail).
		const progress = gsap.to(bar, {
			scaleX: 1,
			ease: 'none',
			scrollTrigger: { start: 0, end: 'max', scrub: 0.3 }
		});

		// Route in-page anchors through Lenis so jumps glide instead of teleporting.
		const onClick = (e: MouseEvent) => {
			const a = (e.target as HTMLElement).closest('a');
			const href = a?.getAttribute('href');
			if (!href || !href.startsWith('#') || href.length < 2 || a?.classList.contains('skip')) return;
			e.preventDefault();
			scrollToTarget(href === '#top' ? 0 : href);
		};
		document.addEventListener('click', onClick);

		// Fonts change line lengths, which moves every trigger.
		document.fonts?.ready.then(() => ScrollTrigger.refresh());

		return () => {
			document.removeEventListener('click', onClick);
			progress.scrollTrigger?.kill();
			progress.kill();
			stopScroll();
			stopField();
		};
	});
</script>

<svelte:head>
	<!-- .ico for older browsers, SVG where supported, and an opaque PNG for iOS home screens. -->
	<link rel="icon" href="/favicon.ico" sizes="32x32" />
	<link rel="icon" href={favicon} type="image/svg+xml" />
	<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
	<title>{site.name} / {site.role}</title>
	<meta name="description" content={site.description} />
	<link rel="canonical" href="{site.url}/" />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="{site.url}/" />
	<meta property="og:site_name" content={site.name} />
	<meta property="og:title" content="{site.name} / {site.role}" />
	<meta property="og:description" content={site.description} />
	<meta property="og:image" content="{site.url}/og.jpg" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content="Rodin's Thinker beside the line: I build things to understand them." />
	<meta name="twitter:card" content="summary_large_image" />
</svelte:head>

<a class="skip label" href="#main">Skip to content</a>
<Drift />
<span class="progress" bind:this={bar} aria-hidden="true"></span>
<ScrollRail />
<Intro />
<Nav />

<main id="main" tabindex="-1">
	{@render children()}
</main>

<div class="grain" aria-hidden="true"></div>

<style>
	.progress {
		position: fixed;
		inset: 0 0 auto;
		z-index: calc(var(--z-nav) + 1);
		height: 2px;
		background: var(--accent);
		transform: scaleX(0);
		transform-origin: left;
		pointer-events: none;
	}

	@media (pointer: fine) and (min-width: 768px) {
		.progress {
			display: none;
		}
	}

	.grain {
		position: fixed;
		inset: 0;
		z-index: var(--z-grain);
		pointer-events: none;
		opacity: 0.05;
		background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
	}

	:global([data-theme='dark']) .grain {
		opacity: 0.07;
	}
</style>
