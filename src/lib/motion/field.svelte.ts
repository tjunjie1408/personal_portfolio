/**
 * Which section owns the background right now. Sections declare a mode with `data-field` and may
 * mark one element inside with `data-field-anchor` for modes that gather around something. Both
 * background layers (Drift, the motes; Flow, the dithered water) read this, so a new section
 * only has to pick a mode, and a new mode is one entry here plus one row in each layer's table
 * (the `Record<Mode, …>` types make a missing row a type error).
 */

export const MODES = [
	'current',
	'sediment',
	'lattice',
	'rise',
	'stream',
	'split',
	'orbit',
	'fall',
	'constellation',
	'gather'
] as const;
export type Mode = (typeof MODES)[number];

export const field = $state<{ mode: Mode; anchor: HTMLElement | null }>({ mode: 'current', anchor: null });

const isMode = (v: string | undefined): v is Mode => !!v && (MODES as readonly string[]).includes(v);

/** The section crossing the middle of the viewport owns the field. Call once, from the layout. */
export function watchField() {
	const io = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (!entry.isIntersecting) continue;
				const el = entry.target as HTMLElement;
				const mode = el.dataset.field;
				if (!isMode(mode) || mode === field.mode) continue;
				field.anchor = el.querySelector<HTMLElement>('[data-field-anchor]');
				field.mode = mode;
			}
		},
		{ rootMargin: '-50% 0px -50% 0px' }
	);
	// Sections render in the page, which may mount after the layout.
	const observe = requestAnimationFrame(() =>
		document.querySelectorAll('[data-field]').forEach((el) => io.observe(el))
	);
	return () => {
		cancelAnimationFrame(observe);
		io.disconnect();
	};
}
