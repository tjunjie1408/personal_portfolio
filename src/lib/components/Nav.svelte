<script lang="ts">
	import { onMount } from 'svelte';
	import { gsap } from 'gsap';
	import { ScrollTrigger } from 'gsap/ScrollTrigger';
	import DecryptedText from './svelte-bits/DecryptedText.svelte';
	import { nav, site } from '$lib/content';
	import { theme, toggleTheme } from '$lib/theme.svelte';
	import { intro } from '$lib/motion/intro.svelte';
	import { lockScroll } from '$lib/motion/scroll.svelte';

	let hovered = $state(-1);
	let hidden = $state(false);
	let open = $state(false);
	let menuEl: HTMLDivElement | undefined = $state();

	onMount(() => {
		gsap.registerPlugin(ScrollTrigger);
		// Step aside while reading downward, return on any upward scroll.
		const st = ScrollTrigger.create({
			start: 0,
			end: 'max',
			onUpdate: (self) => {
				hidden = self.direction === 1 && self.scroll() > 120;
			}
		});
		return () => st.kill();
	});

	function setMenu(next: boolean) {
		open = next;
		lockScroll(next);
	}

	$effect(() => {
		if (!open || !menuEl) return;
		const items = menuEl.querySelectorAll('.menu-link');
		const tween = gsap.fromTo(
			items,
			{ yPercent: 110 },
			{ yPercent: 0, duration: 0.9, ease: 'expo.out', stagger: 0.06, delay: 0.15 }
		);
		return () => tween.kill();
	});
</script>

<header class="nav" class:hidden={hidden && !open} class:ready={intro.done}>
	<div class="bar wrap">
		<a href="#top" class="name" onclick={() => setMenu(false)}>{site.name}</a>

		<nav class="links" aria-label="Primary">
			{#each nav as item, i (item.href)}
				<a
					href={item.href}
					class="mono"
					onmouseenter={() => (hovered = i)}
					onmouseleave={() => (hovered = -1)}
				>
					<DecryptedText text={item.label} trigger={hovered === i} characters="abcdefghijklmnopqrstuvwxyz" />
				</a>
			{/each}
		</nav>

		<div class="actions">
			<button class="mono toggle" onclick={toggleTheme} aria-label="Switch colour theme">
				{theme.current === 'dark' ? 'Light' : 'Dark'}
			</button>
			<button class="mono menu-btn" aria-expanded={open} aria-controls="menu" onclick={() => setMenu(!open)}>
				{open ? 'Close' : 'Menu'}
			</button>
		</div>
	</div>
</header>

<div id="menu" class="menu" class:open bind:this={menuEl} inert={!open}>
	<nav class="wrap" aria-label="Mobile">
		{#each nav as item (item.href)}
			<span class="line-mask">
				<a class="menu-link line" href={item.href} onclick={() => setMenu(false)}>{item.label}</a>
			</span>
		{/each}
	</nav>
</div>

<style>
	.nav {
		position: fixed;
		inset: 0 0 auto;
		z-index: var(--z-nav);
		transition:
			transform 0.7s var(--ease-out),
			opacity 0.8s var(--ease-out);
		mix-blend-mode: difference;
		color: #eeeeec;
	}

	:global(.js) .nav:not(.ready) {
		opacity: 0;
		transform: translateY(-100%);
	}

	.nav.hidden {
		transform: translateY(-100%);
	}

	.bar {
		height: 64px;
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		gap: 2rem;
	}

	.name {
		font-weight: 500;
		letter-spacing: -0.01em;
		justify-self: start;
	}

	.links {
		display: flex;
		gap: 2.25rem;
	}

	/* The bar uses a difference blend, so an accent colour would invert; dim instead. */
	.links :global(.scrambled) {
		color: inherit;
		opacity: 0.45;
	}

	.links a {
		position: relative;
		padding-block: 0.25rem;
	}

	.links a::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		height: 1px;
		background: currentColor;
		transform: scaleX(0);
		transform-origin: right;
		transition: transform 0.6s var(--ease-out);
	}

	.links a:hover::after {
		transform: scaleX(1);
		transform-origin: left;
	}

	.actions {
		justify-self: end;
		display: flex;
		gap: 1.5rem;
	}

	.toggle,
	.menu-btn {
		padding-block: 0.25rem;
	}

	.menu-btn {
		display: none;
	}

	.menu {
		position: fixed;
		inset: 0;
		z-index: calc(var(--z-nav) - 1);
		background: var(--bg);
		display: flex;
		align-items: flex-end;
		padding-bottom: 4rem;
		clip-path: inset(0 0 100% 0);
		transition: clip-path 0.9s var(--ease-in-out);
	}

	.menu.open {
		clip-path: inset(0 0 0 0);
	}

	.menu nav {
		display: grid;
		gap: 0.25rem;
	}

	.menu-link {
		font-size: clamp(2.75rem, 12vw, 5rem);
		letter-spacing: -0.04em;
		line-height: 1.05;
	}

	@media (max-width: 767px) {
		.links {
			display: none;
		}

		.menu-btn {
			display: inline-block;
		}

		.bar {
			grid-template-columns: 1fr auto;
		}
	}

	@media (min-width: 768px) {
		.menu {
			display: none;
		}
	}
</style>
