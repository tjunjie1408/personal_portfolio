<!--
	The water under the page. One full-screen shader draws domain-warped noise as an ordered
	(Bayer) dither, like a halftone print of moving water, so the paper itself is never quite the
	same twice. It sits behind the motes (Drift) and follows the same section modes, easing from
	one to the next:

	  current        drifts downstream in long horizontal bands
	  sediment       nearly still, and settles toward the foot of the screen
	  lattice        snapped to a coarse grid, reason imposed on the water
	  rise           lifts in vertical bands
	  stream         streaks sideways with the horizontal pan
	  split          two layers flowing in opposite directions
	  orbit          a slow eddy around the portrait
	  fall           runs down the page with the timeline
	  constellation  thins to scattered points
	  gather         pools around the pointer, or the button

	A click drops a stone: a ring runs out from the pointer, warps the water and briefly carries
	the accent. Scrolling moves the water a little slower than the page, for depth.

	Plain WebGL, no three.js, so it costs nothing before the statue loads. The canvas is half the
	CSS resolution with pixelated scaling, so each dither dot is a crisp 2px square. Under reduced
	motion it renders one still frame; without WebGL it is simply absent.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { field, MODES, type Mode } from '$lib/motion/field.svelte';
	import { scroll } from '$lib/motion/scroll.svelte';
	import { theme } from '$lib/theme.svelte';

	let canvas: HTMLCanvasElement;

	let recolour: (() => void) | null = null;
	$effect(() => {
		void theme.current;
		// The theme attribute changes in the same tick; read the new tokens once styles apply.
		const id = requestAnimationFrame(() => recolour?.());
		return () => cancelAnimationFrame(id);
	});

	/**
	 * Per-mode water. `flow` is drift in screen heights per second (+y is up). `stretch` squashes
	 * the noise per axis, so bands run along the smaller value. `tone` is how much of the screen
	 * is dotted at all. The rest are 0..1 blends.
	 */
	type Look = {
		flow: [number, number];
		scale: number;
		stretch: [number, number];
		tone: number;
		swirl: number;
		split: number;
		grid: number;
		settle: number;
		pool: number;
		sparse: number;
		river: number;
	};

	const LOOK: Record<Mode, Look> = {
		current: { flow: [0.035, 0], scale: 2.2, stretch: [0.7, 2.2], tone: 0.55, swirl: 0, split: 0, grid: 0, settle: 0, pool: 0, sparse: 0, river: 0.12 },
		sediment: { flow: [0.006, -0.008], scale: 2.6, stretch: [1, 1], tone: 0.62, swirl: 0, split: 0, grid: 0, settle: 1, pool: 0, sparse: 0, river: 0.08 },
		lattice: { flow: [0.012, 0.008], scale: 2.4, stretch: [1, 1], tone: 0.6, swirl: 0, split: 0, grid: 1, settle: 0, pool: 0, sparse: 0, river: 0.05 },
		rise: { flow: [0, 0.03], scale: 2.4, stretch: [2.4, 0.7], tone: 0.55, swirl: 0, split: 0, grid: 0, settle: 0, pool: 0, sparse: 0, river: 0.35 },
		stream: { flow: [-0.12, 0], scale: 2, stretch: [0.3, 2.8], tone: 0.55, swirl: 0, split: 0, grid: 0, settle: 0, pool: 0, sparse: 0, river: 0.2 },
		split: { flow: [0.06, 0], scale: 2.2, stretch: [0.5, 2.4], tone: 0.62, swirl: 0, split: 1, grid: 0, settle: 0, pool: 0, sparse: 0, river: 0.25 },
		orbit: { flow: [0, 0], scale: 2.2, stretch: [1, 1], tone: 0.55, swirl: 1, split: 0, grid: 0, settle: 0, pool: 0, sparse: 0, river: 0.12 },
		fall: { flow: [0, -0.06], scale: 2.2, stretch: [2.6, 0.55], tone: 0.6, swirl: 0, split: 0, grid: 0, settle: 0, pool: 0, sparse: 0, river: 0.5 },
		constellation: { flow: [0.01, 0.006], scale: 3.4, stretch: [1, 1], tone: 0.5, swirl: 0, split: 0, grid: 0, settle: 0, pool: 0, sparse: 1, river: 0.1 },
		gather: { flow: [0, 0], scale: 2.4, stretch: [1, 1], tone: 0.7, swirl: 0.5, split: 0, grid: 0, settle: 0, pool: 1, sparse: 0, river: 0.1 }
	};

	const RIPPLES = 6;

	const vertex = /* glsl */ `
		attribute vec2 aPos;
		void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
	`;

	const fragment = /* glsl */ `
		precision highp float;
		uniform vec2 uRes;       // canvas pixels
		uniform float uCell;     // CSS px per canvas pixel
		uniform float uTime;
		uniform vec2 uOffset;    // integrated flow
		uniform float uSplitOffset;
		uniform float uScale;
		uniform vec2 uStretch;
		uniform float uTone;
		uniform float uSwirl;
		uniform float uSwirlPhase;
		uniform vec2 uCentre;    // 0..1, y up
		uniform float uSplit;
		uniform float uGrid;
		uniform float uSettle;
		uniform float uPool;
		uniform float uSparse;
		uniform float uRiver;
		uniform float uAlpha;
		uniform vec3 uInk;
		uniform vec3 uRiverC;
		uniform vec3 uAccentC;
		uniform vec3 uPointer;   // xy canvas px, z presence
		uniform vec4 uRipples[${RIPPLES}]; // xy canvas px, z age in s (negative: unused), w strength

		float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
		float noise(vec2 p) {
			vec2 i = floor(p), f = fract(p);
			vec2 u = f * f * (3.0 - 2.0 * f);
			return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
		}
		float fbm(vec2 p) {
			float v = 0.0, a = 0.5;
			for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.03 + 17.1; a *= 0.5; }
			return v;
		}
		// Ordered dither threshold, 8x8, built up from the 2x2 matrix.
		float bayer2(vec2 a) { a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }
		float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
		float bayer8(vec2 a) { return bayer4(0.5 * a) * 0.25 + bayer2(a); }

		void main() {
			vec2 px = gl_FragCoord.xy;
			vec2 uv01 = px / uRes;
			float aspect = uRes.x / uRes.y;
			vec2 uv = vec2(uv01.x * aspect, uv01.y);
			vec2 c = vec2(uCentre.x * aspect, uCentre.y);

			// Stones: each ring pushes the water outward as it passes and lights up its front.
			float ring = 0.0;
			vec2 push = vec2(0.0);
			for (int i = 0; i < ${RIPPLES}; i++) {
				vec4 r = uRipples[i];
				if (r.z < 0.0) continue;
				vec2 d = px - r.xy;
				float dist = length(d);
				float radius = r.z * 520.0 / uCell;
				float width = 26.0 / uCell;
				float x = (dist - radius) / width;
				float front = exp(-x * x) * exp(-r.z * 1.4) * r.w;
				ring += front;
				push += (d / max(dist, 1.0)) * front * 0.035;
			}

			vec2 p = uv + push;

			// Eddy: turn the water around the centre, faster near it.
			vec2 rel = p - c;
			float angle = uSwirl * (0.35 / (length(rel) + 0.25)) + uSwirlPhase;
			float s = sin(angle), co = cos(angle);
			p = mix(p, c + mat2(co, -s, s, co) * rel, clamp(uSwirl, 0.0, 1.0));

			// Two layers, top and bottom, moving against each other.
			float side = mix(1.0, sign(uv01.y - 0.5), uSplit);
			p = p * uScale / uStretch + vec2(uOffset.x * side + uSplitOffset * uSplit * side, uOffset.y);
			p = mix(p, floor(p * 3.0) / 3.0 + 0.16, uGrid * 0.85);

			vec2 q = vec2(fbm(p + vec2(0.0, uTime * 0.03)), fbm(p + vec2(5.2, 1.3) - uTime * 0.02));
			float n = fbm(p + 1.7 * q);

			// Halftone only on the crests; everywhere else the paper stays clear.
			float tone = smoothstep(0.6, 0.95, n) * 0.55 * uTone;
			// Contour lines through the water, drawn in the same dots: the main mark.
			float level = n * 6.0;
			float contour = 1.0 - smoothstep(0.0, 0.05, 0.5 - abs(fract(level) - 0.5));
			tone = max(tone, contour * 0.8 * uTone);
			tone *= mix(1.0, smoothstep(0.85, 0.0, uv01.y) * 1.4, uSettle);
			tone *= mix(1.0, smoothstep(0.75, 0.0, length(uv - c)) * 1.6, uPool);
			tone = mix(tone, step(0.72, n) * step(0.8, hash(floor(px / 3.0))) , uSparse);
			// The page's text lives in the middle; the water is quieter there than at the edges.
			float edge = smoothstep(0.1, 0.72, length((uv01 - 0.5) * vec2(1.25, 1.0)));
			tone *= mix(0.3, 1.0, edge);
			tone += ring * 0.9;
			tone += uPointer.z * exp(-dot(px - uPointer.xy, px - uPointer.xy) / pow(110.0 / uCell, 2.0)) * 0.22;

			// Offset by half a step so a tone of zero lights no dots at all.
			float on = step(bayer8(px) + 0.5 / 64.0, tone);
			if (on < 0.5) discard;

			vec3 col = mix(uInk, uRiverC, step(1.0 - uRiver, q.x * 1.25 - 0.1));
			col = mix(col, uAccentC, clamp(ring * 1.6, 0.0, 1.0));
			float a = uAlpha * (1.0 + clamp(ring, 0.0, 1.0) * 3.0);
			gl_FragColor = vec4(col * a, a);
		}
	`;

	const hex = (v: string): [number, number, number] => {
		const h = v.replace('#', '');
		const n = parseInt(h.length === 3 ? h.replace(/./g, '$&$&') : h, 16);
		return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
	};

	onMount(() => {
		const gl = canvas.getContext('webgl', { premultipliedAlpha: true, antialias: false, alpha: true });
		if (!gl) return;

		const compile = (type: number, src: string) => {
			const sh = gl.createShader(type)!;
			gl.shaderSource(sh, src);
			gl.compileShader(sh);
			if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) ?? 'shader');
			return sh;
		};
		const program = gl.createProgram()!;
		try {
			gl.attachShader(program, compile(gl.VERTEX_SHADER, vertex));
			gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment));
			gl.linkProgram(program);
			if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('link');
		} catch (e) {
			console.warn('Flow background disabled:', e);
			return;
		}
		gl.useProgram(program);

		// One triangle that covers the screen.
		const buf = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, buf);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
		const aPos = gl.getAttribLocation(program, 'aPos');
		gl.enableVertexAttribArray(aPos);
		gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

		const u = (name: string) => gl.getUniformLocation(program, name);
		const loc = Object.fromEntries(
			[
				'uRes', 'uCell', 'uTime', 'uOffset', 'uSplitOffset', 'uScale', 'uStretch', 'uTone', 'uSwirl',
				'uSwirlPhase', 'uCentre', 'uSplit', 'uGrid', 'uSettle', 'uPool', 'uSparse', 'uRiver', 'uAlpha',
				'uInk', 'uRiverC', 'uAccentC', 'uPointer', 'uRipples'
			].map((n) => [n, u(n)])
		) as Record<string, WebGLUniformLocation | null>;

		const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
		const CELL = 2;
		let width = 0;
		let height = 0;
		const resize = () => {
			width = Math.ceil(window.innerWidth / CELL);
			height = Math.ceil(window.innerHeight / CELL);
			canvas.width = width;
			canvas.height = height;
			gl.viewport(0, 0, width, height);
			gl.uniform2f(loc.uRes, width, height);
			gl.uniform1f(loc.uCell, CELL);
			if (reduce) draw(0);
		};

		recolour = () => {
			const css = getComputedStyle(document.documentElement);
			const tok = (n: string) => hex(css.getPropertyValue(n).trim());
			gl.uniform3fv(loc.uInk, tok('--ink'));
			gl.uniform3fv(loc.uRiverC, tok('--river'));
			gl.uniform3fv(loc.uAccentC, tok('--accent'));
			gl.uniform1f(loc.uAlpha, theme.current === 'dark' ? 0.1 : 0.075);
			if (reduce) draw(0);
		};

		// Blended look, eased toward the active mode's row.
		const w = Object.fromEntries(MODES.map((m) => [m, m === field.mode ? 1 : 0])) as Record<Mode, number>;
		const offset = [0, 0];
		let splitOffset = 0;
		let swirlPhase = 0;
		const centre = [0.5, 0.5];
		const pointer = { x: 0, y: 0, at: -1e9, presence: 0 };
		const ripples = new Float32Array(RIPPLES * 4).fill(-1);
		const born = new Float32Array(RIPPLES).fill(-1);
		let nextRipple = 0;

		const draw = (t: number, dt = 0) => {
			const k = reduce ? 1 : 1 - Math.exp(-dt * 1.6);
			for (const m of MODES) w[m] += ((m === field.mode ? 1 : 0) - w[m]) * k;

			const mix = (pick: (l: Look) => number) => MODES.reduce((sum, m) => sum + pick(LOOK[m]) * w[m], 0);
			const flowX = mix((l) => l.flow[0]);
			const flowY = mix((l) => l.flow[1]);
			const scale = mix((l) => l.scale);
			// Scrolling carries the water up with the page, a little slower; in the pinned Work pan
			// the same scroll becomes sideways motion.
			const v = scroll.velocity / Math.max(1, window.innerHeight);
			offset[0] += flowX * scale * dt - v * scale * 1.2 * w.stream;
			offset[1] += flowY * scale * dt + v * scale * 0.4 * (1 - w.stream);
			splitOffset += 0.05 * scale * dt;
			swirlPhase += 0.06 * dt;

			// Orbit and gather centre on their anchor, or the pointer while it moves.
			const anchor = field.anchor;
			let cx = 0.5;
			let cy = 0.5;
			const fresh = t - pointer.at < 2500;
			if (field.mode === 'gather' && fresh) {
				cx = pointer.x / window.innerWidth;
				cy = 1 - pointer.y / window.innerHeight;
			} else if (anchor) {
				const r = anchor.getBoundingClientRect();
				cx = (r.left + r.width / 2) / window.innerWidth;
				cy = 1 - (r.top + r.height / 2) / window.innerHeight;
			}
			const ck = reduce ? 1 : 1 - Math.exp(-dt * 3);
			centre[0] += (cx - centre[0]) * ck;
			centre[1] += (cy - centre[1]) * ck;

			pointer.presence += ((fresh && !reduce ? 1 : 0) - pointer.presence) * (1 - Math.exp(-dt * 3));

			for (let i = 0; i < RIPPLES; i++) {
				if (born[i] < 0) continue;
				const age = (t - born[i]) / 1000;
				if (age > 3) {
					born[i] = -1;
					ripples[i * 4 + 2] = -1;
				} else ripples[i * 4 + 2] = age;
			}

			gl.uniform1f(loc.uTime, t / 1000);
			gl.uniform2f(loc.uOffset, offset[0], offset[1]);
			gl.uniform1f(loc.uSplitOffset, splitOffset);
			gl.uniform1f(loc.uScale, scale);
			gl.uniform2f(loc.uStretch, mix((l) => l.stretch[0]), mix((l) => l.stretch[1]));
			gl.uniform1f(loc.uTone, mix((l) => l.tone));
			gl.uniform1f(loc.uSwirl, mix((l) => l.swirl));
			gl.uniform1f(loc.uSwirlPhase, swirlPhase);
			gl.uniform2f(loc.uCentre, centre[0], centre[1]);
			gl.uniform1f(loc.uSplit, mix((l) => l.split));
			gl.uniform1f(loc.uGrid, mix((l) => l.grid));
			gl.uniform1f(loc.uSettle, mix((l) => l.settle));
			gl.uniform1f(loc.uPool, mix((l) => l.pool));
			gl.uniform1f(loc.uSparse, mix((l) => l.sparse));
			gl.uniform1f(loc.uRiver, mix((l) => l.river));
			gl.uniform3f(loc.uPointer, pointer.x / CELL, height - pointer.y / CELL, pointer.presence);
			gl.uniform4fv(loc.uRipples, ripples);

			gl.clearColor(0, 0, 0, 0);
			gl.clear(gl.COLOR_BUFFER_BIT);
			gl.drawArrays(gl.TRIANGLES, 0, 3);
		};

		resize();
		recolour();
		window.addEventListener('resize', resize);

		if (reduce) {
			return () => {
				recolour = null;
				window.removeEventListener('resize', resize);
			};
		}

		const onMove = (e: PointerEvent) => {
			pointer.x = e.clientX;
			pointer.y = e.clientY;
			pointer.at = performance.now();
		};
		// `click` rather than pointerdown, so a touch that starts a scroll drops no stone.
		const onDown = (e: MouseEvent) => {
			const i = nextRipple++ % RIPPLES;
			born[i] = performance.now();
			ripples[i * 4] = e.clientX / CELL;
			ripples[i * 4 + 1] = height - e.clientY / CELL;
			ripples[i * 4 + 2] = 0;
			ripples[i * 4 + 3] = 1;
		};
		window.addEventListener('pointermove', onMove, { passive: true });
		window.addEventListener('click', onDown, { passive: true });

		let raf = 0;
		let last = performance.now();
		const tick = (t: number) => {
			const dt = Math.min((t - last) / 1000, 0.05);
			last = t;
			draw(t, dt);
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
			recolour = null;
			window.removeEventListener('resize', resize);
			window.removeEventListener('pointermove', onMove);
			window.removeEventListener('click', onDown);
			document.removeEventListener('visibilitychange', onVisibility);
			gl.deleteBuffer(buf);
			gl.deleteProgram(program);
		};
	});
</script>

<canvas bind:this={canvas} class="flow" aria-hidden="true"></canvas>

<style>
	.flow {
		position: fixed;
		inset: 0;
		z-index: -2;
		width: 100%;
		height: 100%;
		pointer-events: none;
		image-rendering: pixelated;
	}
</style>
