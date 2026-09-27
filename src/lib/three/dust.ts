import type * as T from 'three';

/**
 * Marble dust hanging in the air around the statue. It drifts downstream (+x) like a slow
 * current, so the air around the figure is never the same twice. A few motes carry the accent.
 * All motion happens in the vertex shader; the CPU only advances one time uniform.
 */
export function createDust(THREE: typeof T, count: number) {
	const positions = new Float32Array(count * 3);
	const seeds = new Float32Array(count);
	const accents = new Float32Array(count);
	for (let i = 0; i < count; i++) {
		positions[i * 3] = (Math.random() - 0.5) * 14;
		positions[i * 3 + 1] = -2.2 + Math.random() * 4.8;
		positions[i * 3 + 2] = -5 + Math.random() * 8;
		seeds[i] = Math.random();
		accents[i] = Math.random() < 0.07 ? 1 : 0;
	}

	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
	geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
	geometry.setAttribute('aAccent', new THREE.BufferAttribute(accents, 1));

	const material = new THREE.ShaderMaterial({
		transparent: true,
		depthWrite: false,
		uniforms: {
			uTime: { value: 0 },
			uSize: { value: 22 },
			uPixelRatio: { value: 1 },
			uOpacity: { value: 0 },
			uStrength: { value: 1 },
			uColor: { value: new THREE.Color(0xffffff) },
			uAccent: { value: new THREE.Color(0xff5a4a) }
		},
		vertexShader: /* glsl */ `
			attribute float aSeed;
			attribute float aAccent;
			uniform float uTime;
			uniform float uSize;
			uniform float uPixelRatio;
			varying float vAccent;
			varying float vEdge;

			void main() {
				vec3 p = position;
				// Downstream drift with wrap-around; slower motes read as further away.
				p.x = mod(p.x + uTime * (0.06 + 0.12 * aSeed) + 7.0, 14.0) - 7.0;
				p.y += sin(uTime * 0.35 + aSeed * 6.2831) * 0.12;
				p.z += cos(uTime * 0.25 + aSeed * 12.0) * 0.08;

				vec4 mv = modelViewMatrix * vec4(p, 1.0);
				gl_Position = projectionMatrix * mv;
				// Capped so motes drifting past the lens never bloom into blobs.
				gl_PointSize = min(uSize * (0.35 + aSeed) * uPixelRatio / -mv.z, 4.5 * uPixelRatio);

				vAccent = aAccent;
				vEdge = smoothstep(7.0, 5.5, abs(p.x));
			}
		`,
		fragmentShader: /* glsl */ `
			uniform vec3 uColor;
			uniform vec3 uAccent;
			uniform float uOpacity;
			uniform float uStrength;
			varying float vAccent;
			varying float vEdge;

			void main() {
				float d = length(gl_PointCoord - 0.5);
				float a = smoothstep(0.5, 0.05, d);
				if (a < 0.01) discard;
				vec3 c = mix(uColor, uAccent, vAccent);
				gl_FragColor = vec4(c, a * vEdge * uOpacity * uStrength * mix(1.0, 1.6, vAccent));
			}
		`
	});

	const points = new THREE.Points(geometry, material);
	points.frustumCulled = false;

	return {
		points,
		material,
		setTheme(dark: boolean, accent: string) {
			// Pale theme: soft grey motes at lower strength, so they read as dust, not dirt.
			material.uniforms.uColor.value.set(dark ? 0xf1efea : 0x9a9aa0);
			material.uniforms.uStrength.value = dark ? 1 : 0.6;
			material.uniforms.uAccent.value.set(accent);
			material.blending = dark ? THREE.AdditiveBlending : THREE.NormalBlending;
			material.needsUpdate = true;
		},
		dispose() {
			geometry.dispose();
			material.dispose();
		}
	};
}
