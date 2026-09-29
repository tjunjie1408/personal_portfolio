<!--
	A faint current of motes behind the whole page. Each section tells the field how to behave
	(`data-field` on the section), and the motes ease from one behaviour to the next, so crossing
	a section boundary changes the air rather than cutting to a new scene:

	  current        Opening      drifting downstream, as the river under the statue
	  sediment       Premise      the current slows and the dust settles
	  lattice        Principles   reason: every mote finds its place on a grid
	  rise           Education    motes lift slowly, the opposite of the fall that follows
	  stream         Work         streaks that race sideways with the horizontal pan
	  split          Quotes       two currents in opposite directions, like the two marquees
	  orbit          About        a slow turn around the portrait
	  fall           Experience   the river runs down the page with the timeline
	  constellation  Toolkit      near motes link up, and link to the pointer
	  gather         Contact      the dust closes in around the pointer, or the button

	Scroll velocity still pushes nearer motes further. Disabled under reduced motion; pauses in
	background tabs.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { field, MODES, type Mode } from '$lib/motion/field.svelte';
	import { scroll } from '$lib/motion/scroll.svelte';
	import { theme } from '$lib/theme.svelte';

	let canvas: HTMLCanvasElement;

	/** How much of the field shows accent and river motes, and how bright it is, per mode. */
	const LOOK: Record<Mode, { accent: number; river: number; alpha: number }> = {
		current: { accent: 0.05, river: 0.05, alpha: 1 },
		sediment: { accent: 0.03, river: 0.04, alpha: 0.75 },
		lattice: { accent: 0.04, river: 0.03, alpha: 1.15 },
		rise: { accent: 0.03, river: 0.14, alpha: 0.7 },
		stream: { accent: 0.06, river: 0.08, alpha: 1 },
		split: { accent: 0.2, river: 0.2, alpha: 1 },
		orbit: { accent: 0.1, river: 0.04, alpha: 0.95 },
		fall: { accent: 0.04, river: 0.32, alpha: 1 },
		constellation: { accent: 0.05, river: 0.08, alpha: 1 },
		gather: { accent: 0.22, river: 0.06, alpha: 1.1 }
	};

	// Canvas needs literal colours; these mirror --ink, --accent and --river in app.css.
	const COLOURS = {
		light: { ink: '20,20,22', accent: '200,32,26', river: '47,107,134' },
		dark: { ink: '236,236,234', accent: '255,90,74', river: '121,180,207' }
	};

	type Mote = {
		x: number;
		y: number;
		vx: number;
		vy: number;
		z: number;
		r: number;
		/** Fixed random draw that decides the mote's colour against the mode's shares. */
		tint: number;
		phase: number;
		/** 0..1, where the mote sits in a ring (orbit, gather). */
		ring: number;
		gx: number;
		gy: number;
	};

	onMount(() => {
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		let width = 0;
		let height = 0;
		let motes: Mote[] = [];

		let active: Mode = 'current';
		let anchor: HTMLElement | null = null;
		const w = Object.fromEntries(MODES.map((m) => [m, m === 'current' ? 1 : 0])) as Record<Mode, number>;
		const pointer = { x: 0, y: 0, at: -1e9 };

		// Grid targets are handed out by position (rows by y, then columns by x), so each mote
		// travels to a nearby cell instead of crossing the screen.
		const assignLattice = () => {
			const n = motes.length;
			if (!n) return;
			const cols = Math.max(1, Math.round(Math.sqrt((n * width) / height)));
			const rows = Math.ceil(n / cols);
			const cw = width / cols;
			const rh = height / rows;
			const byY = [...motes].sort((a, b) => a.y - b.y);
			for (let row = 0; row < rows; row++) {
				const band = byY.slice(row * cols, row * cols + cols).sort((a, b) => a.x - b.x);
				// A short last row is centred rather than left-packed.
				const offset = ((cols - band.length) * cw) / 2;
				band.forEach((m, col) => {
					m.gx = offset + (col + 0.5) * cw;
					m.gy = (row + 0.5) * rh;
				});
			}
		};

		const resize = () => {
			const dpr = Math.min(window.devicePixelRatio || 1, 2);
			width = window.innerWidth;
			height = window.innerHeight;
			canvas.width = width * dpr;
			canvas.height = height * dpr;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			const count = Math.round(Math.min(140, (width * height) / 11000));
			motes = Array.from({ length: count }, () => {
				const z = 0.2 + Math.random() * 0.8;
				return {
					x: Math.random() * width,
					y: Math.random() * height,
					vx: 0,
					vy: 0,
					z,
					r: 0.5 + z * 1.4,
					tint: Math.random(),
					phase: Math.random() * Math.PI * 2,
					ring: Math.random(),
					gx: 0,
					gy: 0
				};
			});
			assignLattice();
		};
		resize();
		window.addEventListener('resize', resize);

		const onPointer = (e: PointerEvent) => {
			pointer.x = e.clientX;
			pointer.y = e.clientY;
			pointer.at = performance.now();
		};
		window.addEventListener('pointermove', onPointer, { passive: true });

		/** Desired velocity toward a ring of radius R around (cx, cy), turning at `spin` px/s. */
		const ringVelocity = (m: Mote, cx: number, cy: number, R: number, spin: number, gain: number) => {
			const dx = m.x - cx;
			const dy = m.y - cy;
			const d = Math.hypot(dx, dy) || 1;
			const pull = (R - d) * gain;
			return [(-dy / d) * spin + (dx / d) * pull, (dx / d) * spin + (dy / d) * pull];
		};

		const centreOf = (el: HTMLElement | null) => {
			if (!el) return [width / 2, height / 2];
			const r = el.getBoundingClientRect();
			return [r.left + r.width / 2, r.top + r.height / 2];
		};

		const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

		let raf = 0;
		let last = performance.now();
		const tick = (t: number) => {
			const dt = Math.min((t - last) / 1000, 0.05);
			last = t;
			if (field.mode !== active) {
				active = field.mode;
				anchor = field.anchor;
				if (active === 'lattice') assignLattice();
			}
			const secs = t / 1000;
			const colours = COLOURS[theme.current === 'dark' ? 'dark' : 'light'];
			const dark = theme.current === 'dark';
			// Lenis velocity is px per frame; nearer motes (higher z) slide further.
			const v = scroll.velocity;

			// Blend every mode's weight toward the active one; ~0.5s time constant.
			const k = 1 - Math.exp(-dt * 2);
			for (const m of MODES) w[m] += ((m === active ? 1 : 0) - w[m]) * k;

			let accentShare = 0;
			let riverShare = 0;
			let alpha = 0;
			for (const m of MODES) {
				accentShare += LOOK[m].accent * w[m];
				riverShare += LOOK[m].river * w[m];
				alpha += LOOK[m].alpha * w[m];
			}

			const [ax, ay] = centreOf(active === 'orbit' || active === 'gather' ? anchor : null);
			const pointerFresh = t - pointer.at < 2500;
			const gx = pointerFresh ? pointer.x : ax;
			const gy = pointerFresh ? pointer.y : ay;
			const orbitR = Math.min(width, height) * 0.42;
			// Target modes pull motes somewhere specific; wrapping would fling them across the screen.
			const seeking = w.lattice + w.orbit + w.gather;
			const steer = 1 - Math.exp(-dt * 3);

			ctx.clearRect(0, 0, width, height);

			for (const m of motes) {
				const sway = Math.sin(secs * 0.6 + m.phase);
				let tx = 0;
				let ty = 0;
				const add = (weight: number, x: number, y: number) => {
					if (weight < 0.001) return;
					tx += x * weight;
					ty += y * weight;
				};

				add(w.current, 8 + 16 * m.z, sway * 4);
				add(w.sediment, Math.sin(secs * 0.3 + m.phase) * 3, 5 + 8 * m.z);
				add(w.lattice, clamp((m.gx - m.x) * 1.6, -220, 220), clamp((m.gy - m.y) * 1.6, -220, 220));
				add(w.rise, sway * 6, -(8 + 18 * m.z));
				add(w.stream, clamp(-(20 + 60 * m.z) - v * m.z * 38, -1600, 1600), 0);
				add(w.split, (m.y < height / 2 ? 1 : -1) * (24 + 50 * m.z), sway * 3);
				if (w.orbit > 0.001) {
					const [ox, oy] = ringVelocity(m, ax, ay, 60 + m.ring * orbitR, 18 + 30 * m.z, 0.8);
					add(w.orbit, ox, oy);
				}
				add(w.fall, Math.sin(m.y * 0.008 + m.phase) * 12, 26 + 44 * m.z);
				add(
					w.constellation,
					Math.cos(m.phase + secs * 0.23) * 9,
					Math.sin(m.phase * 1.7 + secs * 0.19) * 9
				);
				if (w.gather > 0.001) {
					const [ox, oy] = ringVelocity(m, gx, gy, 40 + m.ring * 170, 10 + 14 * m.z, 1.1);
					add(w.gather, ox, oy);
				}

				m.vx += (tx - m.vx) * steer;
				m.vy += (ty - m.vy) * steer;
				m.x += m.vx * dt;
				// In the pinned Work pan, vertical scroll becomes sideways motion (handled above).
				m.y += m.vy * dt - v * m.z * 0.35 * (1 - w.stream);

				if (seeking < 0.5) {
					if (m.x > width + 8) m.x = -8;
					else if (m.x < -8) m.x = width + 8;
					if (m.y < -8) m.y = height + 8;
					else if (m.y > height + 8) m.y = -8;
				}

				// Colour: the same draw is compared with the blended shares, so motes recolour one
				// by one as the field changes mode rather than all at once.
				const kind = m.tint < accentShare ? 'accent' : m.tint > 1 - riverShare ? 'river' : 'ink';
				const base = kind === 'ink' ? (dark ? 0.28 : 0.4) : kind === 'accent' ? 0.55 : 0.6;
				const a = Math.min(1, base * m.z * alpha);
				const rgb = colours[kind];

				const speed = Math.hypot(m.vx, m.vy);
				const trail = Math.min(90, speed * (w.stream * 0.05 + w.orbit * 0.06 + w.fall * 0.04));

				if (w.lattice > 0.6) {
					// On the grid the motes become small crosses: the page's order made visible.
					const s = 1.5 + m.z * 2;
					ctx.strokeStyle = `rgba(${rgb},${a})`;
					ctx.lineWidth = 1;
					ctx.beginPath();
					ctx.moveTo(m.x - s, m.y);
					ctx.lineTo(m.x + s, m.y);
					ctx.moveTo(m.x, m.y - s);
					ctx.lineTo(m.x, m.y + s);
					ctx.stroke();
				} else if (trail > 1.5) {
					ctx.strokeStyle = `rgba(${rgb},${a})`;
					ctx.lineWidth = m.r * 1.3;
					ctx.lineCap = 'round';
					ctx.beginPath();
					ctx.moveTo(m.x, m.y);
					ctx.lineTo(m.x - (m.vx / speed) * trail, m.y - (m.vy / speed) * trail);
					ctx.stroke();
				} else {
					ctx.beginPath();
					ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
					ctx.fillStyle = `rgba(${rgb},${a})`;
					ctx.fill();
				}
			}

			// Constellation: faint links between neighbours, and accent links to the pointer.
			if (w.constellation > 0.02) {
				const reach = 130;
				ctx.lineWidth = 1;
				for (let i = 0; i < motes.length; i++) {
					const p = motes[i];
					for (let j = i + 1; j < motes.length; j++) {
						const q = motes[j];
						const d = Math.hypot(p.x - q.x, p.y - q.y);
						if (d > reach) continue;
						ctx.strokeStyle = `rgba(${colours.ink},${(1 - d / reach) * (dark ? 0.16 : 0.2) * w.constellation})`;
						ctx.beginPath();
						ctx.moveTo(p.x, p.y);
						ctx.lineTo(q.x, q.y);
						ctx.stroke();
					}
					if (pointerFresh) {
						const d = Math.hypot(p.x - pointer.x, p.y - pointer.y);
						if (d < 170) {
							ctx.strokeStyle = `rgba(${colours.accent},${(1 - d / 170) * 0.45 * w.constellation})`;
							ctx.beginPath();
							ctx.moveTo(p.x, p.y);
							ctx.lineTo(pointer.x, pointer.y);
							ctx.stroke();
						}
					}
				}
			}

			raf = requestAnimationFrame(tick);
		};

		const onVisibility = () => {
			cancelAnimationFrame(raf);
			if (!document.hidden) {
				last = performance.now();
				raf = requestAnimationFrame(tick);
			}
		};
		document.addEventListener('visibilitychange', onVisibility);
		raf = requestAnimationFrame(tick);

		return () => {
			cancelAnimationFrame(raf);
			window.removeEventListener('resize', resize);
			window.removeEventListener('pointermove', onPointer);
			document.removeEventListener('visibilitychange', onVisibility);
		};
	});
</script>

<canvas bind:this={canvas} class="drift" aria-hidden="true"></canvas>

<style>
	.drift {
		position: fixed;
		inset: 0;
		z-index: -1;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}
</style>
