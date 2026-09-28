import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/** Shared scroll state. Written by Lenis, read by velocity-aware components. */
export const scroll = $state({ velocity: 0 });

let lenis: Lenis | null = null;

export const prefersReducedMotion = () =>
	typeof window !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Smooth scrolling, synced to GSAP's ticker so ScrollTrigger and Lenis share one frame loop. */
export function initSmoothScroll() {
	if (prefersReducedMotion()) return () => {};

	lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1 });
	lenis.on('scroll', (l: Lenis) => {
		scroll.velocity = l.velocity;
		ScrollTrigger.update();
	});

	const tick = (time: number) => lenis?.raf(time * 1000);
	gsap.ticker.add(tick);
	gsap.ticker.lagSmoothing(0);

	return () => {
		gsap.ticker.remove(tick);
		lenis?.destroy();
		lenis = null;
	};
}

export function lockScroll(locked: boolean) {
	if (locked) lenis?.stop();
	else lenis?.start();
	document.documentElement.style.overflow = locked ? 'hidden' : '';
}

/** `follow` tracks a moving target (dragging the scroll rail) instead of running a timed glide. */
export function scrollToTarget(target: string | number, { follow = false } = {}) {
	if (lenis) {
		if (follow) lenis.scrollTo(target, { lerp: 0.25 });
		else lenis.scrollTo(target, { duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 4) });
		return;
	}
	if (typeof target === 'number') window.scrollTo({ top: target });
	else document.querySelector(target)?.scrollIntoView();
}
