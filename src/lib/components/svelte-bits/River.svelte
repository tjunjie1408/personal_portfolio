<!--
	Adapted from Svelte Bits "Waves" (https://sveltebits.xyz).
	Turned sideways into horizontal currents. The noise field takes a fresh random seed on every
	mount, so no visitor ever sees the same river twice. Pauses offscreen; one still frame
	under reduced motion.
-->
<script lang="ts" module>
	class Grad {
		x: number;
		y: number;
		constructor(x: number, y: number) {
			this.x = x;
			this.y = y;
		}
		dot2(x: number, y: number) {
			return this.x * x + this.y * y;
		}
	}

	// Seeded 2D Perlin noise (Stefan Gustavson's permutation, as in the original component).
	class Noise {
		private grad3 = [
			new Grad(1, 1), new Grad(-1, 1), new Grad(1, -1), new Grad(-1, -1),
			new Grad(1, 0), new Grad(-1, 0), new Grad(1, 0), new Grad(-1, 0),
			new Grad(0, 1), new Grad(0, -1), new Grad(0, 1), new Grad(0, -1)
		];
		private p = [151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];
		private perm: number[] = new Array(512);
		private gradP: Grad[] = new Array(512);

		constructor(seed: number) {
			seed = Math.floor(seed * 65536);
			if (seed < 256) seed |= seed << 8;
			for (let i = 0; i < 256; i++) {
				const v = i & 1 ? this.p[i] ^ (seed & 255) : this.p[i] ^ ((seed >> 8) & 255);
				this.perm[i] = this.perm[i + 256] = v;
				this.gradP[i] = this.gradP[i + 256] = this.grad3[v % 12];
			}
		}

		private fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
		private lerp = (a: number, b: number, t: number) => (1 - t) * a + t * b;

		perlin2(x: number, y: number) {
			let X = Math.floor(x);
			let Y = Math.floor(y);
			x -= X;
			y -= Y;
			X &= 255;
			Y &= 255;
			const n00 = this.gradP[X + this.perm[Y]].dot2(x, y);
			const n01 = this.gradP[X + this.perm[Y + 1]].dot2(x, y - 1);
			const n10 = this.gradP[X + 1 + this.perm[Y]].dot2(x - 1, y);
			const n11 = this.gradP[X + 1 + this.perm[Y + 1]].dot2(x - 1, y - 1);
			const u = this.fade(x);
			return this.lerp(this.lerp(n00, n10, u), this.lerp(n01, n11, u), this.fade(y));
		}
	}

	type Point = { x: number; y: number; wx: number; wy: number; cx: number; cy: number; vx: number; vy: number };
</script>

<script lang="ts">
	import { onMount } from 'svelte';

	type Props = {
		lineColor?: string;
		/** Distance between currents. */
		gap?: number;
		/** Distance between points along a current. */
		step?: number;
		flow?: number;
		ampX?: number;
		ampY?: number;
	};

	let { lineColor = 'rgba(20,20,22,0.18)', gap = 16, step = 28, flow = 0.02, ampX = 18, ampY = 12 }: Props =
		$props();

	let host: HTMLDivElement;
	let canvas: HTMLCanvasElement;

	onMount(() => {
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
		const noise = new Noise(Math.random());
		const t0 = Math.random() * 1e5;

		let lines: Point[][] = [];
		let width = 0;
		let height = 0;
		let dpr = 1;
		const mouse = { x: -999, y: -999, sx: -999, sy: -999, lx: 0, ly: 0, vs: 0, a: 0, set: false };

		const build = () => {
			const rect = host.getBoundingClientRect();
			width = rect.width;
			height = rect.height;
			dpr = Math.min(window.devicePixelRatio || 1, 2);
			canvas.width = width * dpr;
			canvas.height = height * dpr;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

			lines = [];
			const rows = Math.ceil((height + 40) / gap);
			const cols = Math.ceil((width + 200) / step);
			for (let i = 0; i <= rows; i++) {
				const pts: Point[] = [];
				for (let j = 0; j <= cols; j++) {
					pts.push({ x: -100 + step * j, y: -20 + gap * i, wx: 0, wy: 0, cx: 0, cy: 0, vx: 0, vy: 0 });
				}
				lines.push(pts);
			}
		};

		const move = (time: number) => {
			const t = time + t0;
			for (const pts of lines) {
				for (const p of pts) {
					// Sampling the field at x - t makes the pattern travel downstream (to the right).
					const m = noise.perlin2((p.x - t * flow * 4) * 0.0018, (p.y + t * flow) * 0.003) * 10;
					p.wx = Math.cos(m) * ampX;
					p.wy = Math.sin(m) * ampY;

					const dx = p.x - mouse.sx;
					const dy = p.y - mouse.sy;
					const dist = Math.hypot(dx, dy);
					const reach = Math.max(160, mouse.vs);
					if (dist < reach) {
						const f = Math.cos(dist * 0.001) * (1 - dist / reach);
						p.vx += Math.cos(mouse.a) * f * reach * mouse.vs * 0.0006;
						p.vy += Math.sin(mouse.a) * f * reach * mouse.vs * 0.0006;
					}
					p.vx = (p.vx - p.cx * 0.005) * 0.925;
					p.vy = (p.vy - p.cy * 0.005) * 0.925;
					p.cx = Math.max(-90, Math.min(90, p.cx + p.vx * 2));
					p.cy = Math.max(-90, Math.min(90, p.cy + p.vy * 2));
				}
			}
		};

		const draw = () => {
			ctx.clearRect(0, 0, width, height);
			ctx.beginPath();
			ctx.strokeStyle = lineColor;
			ctx.lineWidth = 1;
			for (const pts of lines) {
				pts.forEach((p, i) => {
					const x = p.x + p.wx + p.cx;
					const y = p.y + p.wy + p.cy;
					if (i === 0) ctx.moveTo(x, y);
					else ctx.lineTo(x, y);
				});
			}
			ctx.stroke();
		};

		build();
		move(0);
		draw();
		const ro = new ResizeObserver(() => {
			build();
			move(performance.now());
			draw();
		});
		ro.observe(host);
		if (reduce) return () => ro.disconnect();

		let raf = 0;
		const tick = (t: number) => {
			mouse.sx += (mouse.x - mouse.sx) * 0.1;
			mouse.sy += (mouse.y - mouse.sy) * 0.1;
			const dx = mouse.x - mouse.lx;
			const dy = mouse.y - mouse.ly;
			mouse.vs = Math.min(100, mouse.vs + (Math.hypot(dx, dy) - mouse.vs) * 0.1);
			mouse.a = Math.atan2(dy, dx);
			mouse.lx = mouse.x;
			mouse.ly = mouse.y;
			move(t);
			draw();
			raf = requestAnimationFrame(tick);
		};

		const io = new IntersectionObserver(([entry]) => {
			cancelAnimationFrame(raf);
			if (entry.isIntersecting) raf = requestAnimationFrame(tick);
		});
		io.observe(host);

		const onMove = (e: PointerEvent) => {
			const rect = host.getBoundingClientRect();
			mouse.x = e.clientX - rect.left;
			mouse.y = e.clientY - rect.top;
			if (!mouse.set) {
				mouse.sx = mouse.lx = mouse.x;
				mouse.sy = mouse.ly = mouse.y;
				mouse.set = true;
			}
		};
		window.addEventListener('pointermove', onMove, { passive: true });

		return () => {
			cancelAnimationFrame(raf);
			io.disconnect();
			ro.disconnect();
			window.removeEventListener('pointermove', onMove);
		};
	});
</script>

<div bind:this={host} class="river" aria-hidden="true">
	<canvas bind:this={canvas}></canvas>
</div>

<style>
	.river {
		position: absolute;
		inset: 0;
		overflow: hidden;
	}

	canvas {
		display: block;
		width: 100%;
		height: 100%;
	}
</style>
