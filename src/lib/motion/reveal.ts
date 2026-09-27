import type { Action } from 'svelte/action';

type RevealOptions = { delay?: number; threshold?: number } | undefined;

/**
 * Adds `.is-in` the first time the node enters the viewport. The visual states live in
 * app.css under [data-reveal], so the node must also carry that attribute.
 */
export const reveal: Action<HTMLElement, RevealOptions> = (node, options) => {
	if (options?.delay) node.style.setProperty('--reveal-delay', `${options.delay}ms`);

	const io = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (!entry.isIntersecting) continue;
				node.classList.add('is-in');
				io.disconnect();
			}
		},
		{ threshold: options?.threshold ?? 0.2, rootMargin: '0px 0px -8% 0px' }
	);
	io.observe(node);

	return { destroy: () => io.disconnect() };
};
