import type * as T from 'three';

/**
 * The Education stage: a learning curve with a Riemann sum under it. Each credential owns one
 * stretch of the x axis; as the reader moves down the list the upper bound sweeps right and the
 * bars rise to meet the curve, so what has been learnt reads as area accumulated. Past stretches
 * are river-coloured, the stretch being read is the accent, and the stretch after the last
 * credential stays a ghost: the integral is not finished.
 *
 * Grains of sediment fall onto the stretch being read and settle into it. All per-bar motion is
 * on the GPU; the CPU eases one float per bar and a handful of uniforms.
 */

export type IntegralColours = { ink: string; river: string; accent: string; bg: string };

/** Units of x per credential, and the unfinished stretch after the last one. */
const FUTURE = 0.7;
const BARS_PER_UNIT = 18;
/** World-space width of the plot, and how tall the curve is drawn against it. */
const SPAN = 6.4;
const AMP = 1.7;
/** How far the plot is turned from the reader: at the start, and once the sum is complete. */
const TURN_FROM = -0.62;
const TURN_TO = -0.28;

/** The curve. Rising, with the wobble of a real record; always above the axis. */
function curve(t: number) {
	return AMP * (0.32 + 1.25 * Math.pow(t, 0.85) + 0.14 * Math.sin(t * 9.5 + 0.6) + 0.06 * Math.sin(t * 23));
}

export function createIntegral(THREE: typeof T, host: HTMLElement, segments: number) {
	const units = segments + FUTURE;
	const count = Math.round(units * BARS_PER_UNIT);
	const toX = (u: number) => (u / units - 0.5) * SPAN;
	const fAt = (u: number) => curve(u / units);

	const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
	renderer.outputColorSpace = THREE.SRGBColorSpace;
	host.appendChild(renderer.domElement);

	const scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 80);
	const aimAt = new THREE.Vector3(0, AMP * 0.8, 0);
	/** The camera looks down the plot from slightly above; only its distance changes, to fit. */
	const viewDir = new THREE.Vector3(0.04, 0.26, 1).normalize();

	const plot = new THREE.Group();
	scene.add(plot);

	const colour = {
		ink: new THREE.Color(),
		river: new THREE.Color(),
		accent: new THREE.Color(),
		bg: new THREE.Color()
	};

	// ---- Bars ------------------------------------------------------------------------------
	const box = new THREE.BoxGeometry(1, 1, 1);
	box.translate(0, 0.5, 0);
	const bars = new THREE.InstancedMesh(box, undefined as unknown as T.Material, count);
	const lift = new Float32Array(count);
	const tone = new Float32Array(count);
	const liftAttr = new THREE.InstancedBufferAttribute(lift, 1);
	const toneAttr = new THREE.InstancedBufferAttribute(tone, 1);
	liftAttr.setUsage(THREE.DynamicDrawUsage);
	toneAttr.setUsage(THREE.DynamicDrawUsage);
	box.setAttribute('aLift', liftAttr);
	box.setAttribute('aTone', toneAttr);

	const du = units / count;
	const barWidth = (SPAN / count) * 0.72;
	const heights = new Float32Array(count);
	const m = new THREE.Matrix4();
	for (let i = 0; i < count; i++) {
		const u = (i + 0.5) * du;
		heights[i] = fAt(u);
		m.makeScale(barWidth, heights[i], 0.42);
		m.setPosition(toX(u), 0, 0);
		bars.setMatrixAt(i, m);
	}

	const barMaterial = new THREE.ShaderMaterial({
		transparent: true,
		uniforms: {
			uInk: { value: colour.ink },
			uRiver: { value: colour.river },
			uAccent: { value: colour.accent },
			uBg: { value: colour.bg }
		},
		vertexShader: /* glsl */ `
			attribute float aLift;
			attribute float aTone;
			varying float vY;
			varying float vTone;
			varying float vTop;
			varying float vSide;
			void main() {
				vec3 p = position;
				// Unrisen bars keep a sliver so the whole partition stays visible along the axis.
				p.y *= max(aLift, 0.018);
				vY = position.y;
				vTone = aTone;
				vTop = step(0.5, normal.y);
				vSide = abs(normal.x);
				gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(p, 1.0);
			}
		`,
		fragmentShader: /* glsl */ `
			uniform vec3 uInk;
			uniform vec3 uRiver;
			uniform vec3 uAccent;
			uniform vec3 uBg;
			varying float vY;
			varying float vTone;
			varying float vTop;
			varying float vSide;
			void main() {
				// tone: 0 ghost, 1 river (learnt), 2 accent (being learnt)
				vec3 c = mix(uInk, uRiver, clamp(vTone, 0.0, 1.0));
				c = mix(c, uAccent, clamp(vTone - 1.0, 0.0, 1.0));
				float solid = clamp(vTone, 0.0, 1.0);
				// Each bar fades into the paper toward its foot; the top face catches the light.
				float body = mix(0.18, 0.92, smoothstep(0.0, 1.0, vY));
				float alpha = mix(0.1, body, solid);
				c = mix(c, uBg, vSide * 0.28);
				c = mix(c, mix(c, vec3(1.0), 0.35), vTop * solid);
				alpha = max(alpha, vTop * mix(0.16, 1.0, solid));
				gl_FragColor = vec4(c, alpha);
			}
		`
	});
	bars.material = barMaterial;
	bars.instanceMatrix.needsUpdate = true;
	plot.add(bars);

	// ---- Curve, axis, bound ------------------------------------------------------------------
	const samples = 240;
	const curvePts: T.Vector3[] = [];
	for (let i = 0; i <= samples; i++) {
		const u = (i / samples) * units;
		curvePts.push(new THREE.Vector3(toX(u), fAt(u), 0.22));
	}
	const curveGeo = new THREE.BufferGeometry().setFromPoints(curvePts);
	const ghostLine = new THREE.Line(curveGeo, new THREE.LineBasicMaterial({ transparent: true, opacity: 0.22 }));
	const liveLine = new THREE.Line(curveGeo, new THREE.LineBasicMaterial({ transparent: true, opacity: 0.95 }));
	plot.add(ghostLine, liveLine);

	const axisGeo = new THREE.BufferGeometry().setFromPoints([
		new THREE.Vector3(-SPAN / 2 - 0.3, 0, 0.22),
		new THREE.Vector3(SPAN / 2 + 0.3, 0, 0.22)
	]);
	const axis = new THREE.Line(axisGeo, new THREE.LineBasicMaterial({ transparent: true, opacity: 0.35 }));
	plot.add(axis);

	// A diamond on the axis where each credential's stretch begins, as on the rest of the site.
	const diamondGeo = new THREE.PlaneGeometry(0.09, 0.09);
	const marks: T.Mesh<T.PlaneGeometry, T.MeshBasicMaterial>[] = [];
	for (let i = 0; i <= segments; i++) {
		const d = new THREE.Mesh(diamondGeo, new THREE.MeshBasicMaterial({ transparent: true }));
		d.rotation.z = Math.PI / 4;
		d.position.set(toX(i), 0, 0.24);
		marks.push(d);
		plot.add(d);
	}

	// The upper bound: a hairline from the axis to the curve, and a diamond riding the curve.
	const boundGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0)]);
	const bound = new THREE.Line(boundGeo, new THREE.LineBasicMaterial({ transparent: true, opacity: 0.7 }));
	bound.position.z = 0.23;
	const head = new THREE.Mesh(new THREE.PlaneGeometry(0.13, 0.13), new THREE.MeshBasicMaterial());
	head.rotation.z = Math.PI / 4;
	head.position.z = 0.25;
	plot.add(bound, head);

	// ---- Sediment ------------------------------------------------------------------------------
	const grains = 70;
	const seeds = new Float32Array(grains * 3);
	for (let i = 0; i < grains; i++) {
		seeds[i * 3] = Math.random();
		seeds[i * 3 + 1] = Math.random();
		seeds[i * 3 + 2] = Math.random();
	}
	const grainGeo = new THREE.BufferGeometry();
	grainGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(grains * 3), 3));
	grainGeo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 3));
	const grainMaterial = new THREE.ShaderMaterial({
		transparent: true,
		depthWrite: false,
		uniforms: {
			uTime: { value: 0 },
			uFrom: { value: 0 },
			uTo: { value: 0 },
			uSpan: { value: SPAN },
			uUnits: { value: units },
			uAmp: { value: AMP },
			uPixelRatio: { value: renderer.getPixelRatio() },
			uColour: { value: colour.accent },
			uOpacity: { value: 0 }
		},
		vertexShader: /* glsl */ `
			attribute vec3 aSeed;
			uniform float uTime;
			uniform float uFrom;
			uniform float uTo;
			uniform float uSpan;
			uniform float uUnits;
			uniform float uAmp;
			uniform float uPixelRatio;
			varying float vFade;
			float curve(float t) {
				return uAmp * (0.32 + 1.25 * pow(t, 0.85) + 0.14 * sin(t * 9.5 + 0.6) + 0.06 * sin(t * 23.0));
			}
			void main() {
				float u = mix(uFrom, uTo, aSeed.x);
				float floorY = curve(u / uUnits);
				// Fall from above the curve and vanish as the grain reaches it.
				float fall = fract(uTime * (0.1 + 0.14 * aSeed.y) + aSeed.z);
				float y = floorY + (1.0 - fall) * 1.1;
				vec3 p = vec3((u / uUnits - 0.5) * uSpan, y, (aSeed.z - 0.5) * 0.5);
				vFade = smoothstep(0.0, 0.2, 1.0 - fall) * smoothstep(1.0, 0.75, 1.0 - fall);
				vec4 mv = modelViewMatrix * vec4(p, 1.0);
				gl_Position = projectionMatrix * mv;
				gl_PointSize = (1.2 + 1.6 * aSeed.y) * uPixelRatio;
			}
		`,
		fragmentShader: /* glsl */ `
			uniform vec3 uColour;
			uniform float uOpacity;
			varying float vFade;
			void main() {
				vec2 c = gl_PointCoord - 0.5;
				if (dot(c, c) > 0.25) discard;
				gl_FragColor = vec4(uColour, vFade * uOpacity);
			}
		`
	});
	const sediment = new THREE.Points(grainGeo, grainMaterial);
	sediment.frustumCulled = false;
	plot.add(sediment);

	// ---- State -------------------------------------------------------------------------------
	let target = 0;
	let shown = 0;
	const tilt = { x: 0, y: 0, tx: 0, ty: 0 };

	function setColours(c: IntegralColours) {
		colour.ink.set(c.ink);
		colour.river.set(c.river);
		colour.accent.set(c.accent);
		colour.bg.set(c.bg);
		(ghostLine.material as T.LineBasicMaterial).color.copy(colour.ink);
		(liveLine.material as T.LineBasicMaterial).color.copy(colour.ink);
		(axis.material as T.LineBasicMaterial).color.copy(colour.ink);
		(bound.material as T.LineBasicMaterial).color.copy(colour.accent);
		head.material.color.copy(colour.accent);
		marks.forEach((d) => d.material.color.copy(colour.ink));
	}

	/** Upper bound in credential units: 0 is before the first, `segments` is after the last. */
	function setBound(u: number) {
		target = Math.max(0, Math.min(segments, u));
	}

	/** Pointer in -1..1 across the stage; tilts the plot a little. */
	function setPointer(x: number, y: number) {
		tilt.tx = x;
		tilt.ty = y;
	}

	// The plot's corners at its widest turn, for framing.
	const corners: T.Vector3[] = [];
	const peak = Math.max(...heights) * 1.08;
	for (const x of [-SPAN / 2 - 0.3, SPAN / 2 + 0.3])
		for (const y of [0, peak])
			for (const z of [-0.3, 0.3]) corners.push(new THREE.Vector3(x, y, z));
	const probe = new THREE.Vector3();
	const turn = new THREE.Euler();

	/** Moves the camera back along its line of sight until the whole plot fits the stage. */
	function resize() {
		const w = host.clientWidth;
		const h = host.clientHeight;
		if (!w || !h) return;
		renderer.setSize(w, h, false);
		camera.aspect = w / h;
		camera.updateProjectionMatrix();
		const fits = (d: number) => {
			camera.position.copy(aimAt).addScaledVector(viewDir, d);
			camera.lookAt(aimAt);
			camera.updateMatrixWorld();
			for (const r of [TURN_FROM, TURN_TO]) {
				turn.set(0.1, r, 0);
				for (const c of corners) {
					probe.copy(c).applyEuler(turn).project(camera);
					if (Math.abs(probe.x) > 0.9 || Math.abs(probe.y) > 0.8) return false;
				}
			}
			return true;
		};
		let lo = 4;
		let hi = 60;
		for (let i = 0; i < 24; i++) {
			const mid = (lo + hi) / 2;
			if (fits(mid)) hi = mid;
			else lo = mid;
		}
		fits(hi);
	}

	/** Advances one frame. `dt` in seconds; `still` snaps everything to its target. */
	function frame(dt: number, time: number, still = false) {
		const k = still ? 1 : 1 - Math.exp(-dt * 4);
		shown += (target - shown) * k;

		const current = Math.min(segments - 1, Math.floor(shown));
		for (let i = 0; i < count; i++) {
			const u = (i + 0.5) * du;
			const on = u <= shown ? 1 : 0;
			// Bars nearer the bound rise last, so the front edge reads as a wave, not a switch.
			const rate = still ? 1 : 1 - Math.exp(-dt * (5 + (i % 3)));
			lift[i] += (on - lift[i]) * rate;
			const seg = Math.floor(u);
			const t = on ? (seg === current ? 2 : 1) : 0;
			tone[i] += (t - tone[i]) * (still ? 1 : 1 - Math.exp(-dt * 6));
		}
		liftAttr.needsUpdate = true;
		toneAttr.needsUpdate = true;

		liveLine.geometry.setDrawRange(0, Math.max(2, Math.round((shown / units) * samples) + 1));
		const x = toX(shown);
		const y = fAt(shown);
		bound.position.x = x;
		bound.scale.y = y;
		head.position.set(x, y, 0.25);
		head.rotation.z = Math.PI / 4 + time * 0.8;
		const visible = shown > 0.02 ? 1 : 0;
		bound.visible = head.visible = visible > 0;

		grainMaterial.uniforms.uTime.value = time;
		grainMaterial.uniforms.uFrom.value = Math.max(0, current);
		grainMaterial.uniforms.uTo.value = Math.max(0.001, shown);
		const gk = still ? 1 : 1 - Math.exp(-dt * 3);
		grainMaterial.uniforms.uOpacity.value += ((still ? 0 : visible * 0.7) - grainMaterial.uniforms.uOpacity.value) * gk;

		tilt.x += (tilt.tx - tilt.x) * (still ? 1 : 1 - Math.exp(-dt * 2.5));
		tilt.y += (tilt.ty - tilt.y) * (still ? 1 : 1 - Math.exp(-dt * 2.5));
		// The plot turns toward the reader as the sum completes, and leans a little to the pointer.
		plot.rotation.y = TURN_FROM + (shown / segments) * (TURN_TO - TURN_FROM) + tilt.x * 0.1;
		plot.rotation.x = 0.1 + tilt.y * 0.06;

		renderer.render(scene, camera);
	}

	/** The running Riemann sum up to the bound, for the readout. */
	function area() {
		let s = 0;
		for (let i = 0; i < count; i++) s += heights[i] * lift[i] * du;
		return s;
	}

	function dispose() {
		renderer.dispose();
		box.dispose();
		barMaterial.dispose();
		curveGeo.dispose();
		axisGeo.dispose();
		boundGeo.dispose();
		diamondGeo.dispose();
		grainGeo.dispose();
		grainMaterial.dispose();
		renderer.domElement.remove();
	}

	return { setColours, setBound, setPointer, resize, frame, area, dispose };
}
