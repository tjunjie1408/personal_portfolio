<!--
	Adapted from Svelte Bits "Decrypted Text" (https://sveltebits.xyz).
	Trimmed to the two modes this site uses: scramble on hover, and sequential decode on view.
	`trigger` lets a parent (a link or button) drive the hover state.
-->
<script lang="ts">
	import { untrack } from 'svelte';

	type Props = {
		text: string;
		animateOn?: 'hover' | 'view';
		/** Parent-controlled hover. When set, the component ignores its own pointer events. */
		trigger?: boolean;
		speed?: number;
		maxIterations?: number;
		sequential?: boolean;
		characters?: string;
		onDone?: () => void;
	};

	let {
		text,
		animateOn = 'hover',
		trigger,
		speed = 40,
		maxIterations = 8,
		sequential = false,
		characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
		onDone
	}: Props = $props();

	// svelte-ignore state_referenced_locally
	let display = $state(text);
	let revealed = $state(new Set<number>());
	let running = $state(false);
	let el: HTMLSpanElement | undefined = $state();

	const reduce = typeof window !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

	function scramble(keep: Set<number>) {
		const pool = characters;
		return text
			.split('')
			.map((c, i) => (c === ' ' || keep.has(i) ? c : pool[Math.floor(Math.random() * pool.length)]))
			.join('');
	}

	function start() {
		if (running || reduce) return;
		revealed = new Set();
		running = true;
	}

	function stop() {
		running = false;
		revealed = new Set();
		display = text;
	}

	$effect(() => {
		if (!running) return;
		let iteration = 0;
		const id = setInterval(() => {
			if (sequential) {
				if (revealed.size >= text.length) {
					clearInterval(id);
					running = false;
					display = text;
					onDone?.();
					return;
				}
				const next = new Set(revealed);
				next.add(revealed.size);
				revealed = next;
				display = scramble(next);
			} else {
				display = scramble(revealed);
				if (++iteration >= maxIterations) {
					clearInterval(id);
					running = false;
					display = text;
					onDone?.();
				}
			}
		}, speed);
		return () => clearInterval(id);
	});

	// Parent-driven hover.
	$effect(() => {
		if (trigger === undefined) return;
		if (trigger) untrack(start);
	});

	// Decode once when scrolled into view.
	$effect(() => {
		if (animateOn !== 'view' || !el) return;
		if (reduce) {
			onDone?.();
			return;
		}
		display = scramble(new Set());
		const io = new IntersectionObserver(([entry]) => {
			if (!entry.isIntersecting) return;
			untrack(start);
			io.disconnect();
		});
		io.observe(el);
		return () => io.disconnect();
	});

	const ownHover = $derived(animateOn === 'hover' && trigger === undefined);
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<span
	bind:this={el}
	class="decrypted"
	onmouseenter={ownHover ? start : undefined}
	onmouseleave={ownHover ? stop : undefined}
>
	<span class="sr-only">{text}</span>
	<span aria-hidden="true">
		{#each display.split('') as char, i (i)}<span class:scrambled={running && !revealed.has(i) && char !== ' '}
				>{char}</span
			>{/each}
	</span>
</span>

<style>
	.decrypted {
		display: inline-block;
		white-space: pre-wrap;
	}

	.scrambled {
		color: var(--accent);
	}
</style>
