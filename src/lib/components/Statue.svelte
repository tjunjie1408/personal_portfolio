<!--
	Rodin's Thinker in white marble. Reason is the white stone; passion is the single red light
	that follows the visitor's cursor and decides which side of the figure we see.

	The camera never orbits or wanders: it holds one fixed front three-quarter view, slightly
	below eye level, and only ever moves along that line of sight.
	  entrance  opens on the bowed head, then pulls straight back to the whole figure
	  scroll    pushes straight in toward the head as you leave, as if stepping into the thought
	The cursor moves only the red light, never the camera.

	variant="portrait" is the About close-up: a fixed profile of the head and the hand under the
	chin, no dust, a slow push in as it scrolls through, and the same cursor-led red light.

	Loads /models/thinker.glb (prepared by scripts/prepare-model.mjs). three.js is imported lazily
	so it never blocks first paint; rendering pauses offscreen; reduced motion renders one still frame.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { intro } from '$lib/motion/intro.svelte';
	import { scroll } from '$lib/motion/scroll.svelte';
	import { theme } from '$lib/theme.svelte';

	type Variant = 'hero' | 'portrait';
	type Props = { src?: string; accent?: string; variant?: Variant };
	let { src = '/models/thinker.glb', accent = '#ff5a4a', variant = 'hero' }: Props = $props();

	// Each view is one fixed direction (AZ around the vertical axis, EL above the horizon) plus
	// distances along it. For the Rigsters scan, AZ -0.8 is straight-on. The model is normalised to
	// 2 units tall, centred on the origin (head near y 0.75).
	//   start: where the entrance begins   rest: where it settles   leave: where scrolling takes it
	const VIEWS = {
		hero: {
			az: -1.3,
			el: -0.04,
			aim: { x: 0, z: 0 },
			start: { r: 1.7, ty: 0.62 },
			rest: { r: 4.6, ty: 0.3 },
			leave: { r: 2.6, ty: 0.6 }
		},
		// Three-quarter close-up: face, ear, the hand under the chin and the back in one frame.
		// The aim sits forward of the axis, where the head leans.
		portrait: {
			az: -1.55,
			el: 0.04,
			aim: { x: -0.24, z: 0.24 },
			start: { r: 3.2, ty: 0.42 },
			rest: { r: 2.15, ty: 0.54 },
			leave: { r: 1.8, ty: 0.58 }
		}
	} as const;

	// svelte-ignore state_referenced_locally
	const view = VIEWS[variant];
	const AZ: number = view.az;
	const EL: number = view.el;
	const aim = { ...view.aim };
	const REST = view.rest;
	const CLOSE = view.start;
	const LEAVE = view.leave;
	// svelte-ignore state_referenced_locally
	const isHero = variant === 'hero';

	let host: HTMLDivElement;
	let status = $state<'loading' | 'ready' | 'missing'>('loading');

	let applyTheme: ((dark: boolean, accent: string) => void) | null = null;
	let playEntrance: (() => void) | null = null;

	$effect(() => {
		applyTheme?.(theme.current === 'dark', accent);
	});

	$effect(() => {
		if (isHero && intro.done && status === 'ready') playEntrance?.();
	});

	onMount(() => {
		let disposed = false;
		let cleanup = () => {};

		(async () => {
			const [THREE, { GLTFLoader }, { MeshoptDecoder }, { RoomEnvironment }, { gsap }, { ScrollTrigger }, { createDust }] =
				await Promise.all([
					import('three'),
					import('three/examples/jsm/loaders/GLTFLoader.js'),
					import('three/examples/jsm/libs/meshopt_decoder.module.js'),
					import('three/examples/jsm/environments/RoomEnvironment.js'),
					import('gsap'),
					import('gsap/ScrollTrigger'),
					import('$lib/three/dust')
				]);
			if (disposed) return;
			gsap.registerPlugin(ScrollTrigger);

			const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
			const small = matchMedia('(max-width: 767px)').matches;

			const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
			const dpr = Math.min(window.devicePixelRatio, 1.75);
			renderer.setPixelRatio(dpr);
			renderer.outputColorSpace = THREE.SRGBColorSpace;
			renderer.toneMapping = THREE.ACESFilmicToneMapping;
			renderer.toneMappingExposure = 1.05;
			host.appendChild(renderer.domElement);

			const scene = new THREE.Scene();
			const pmrem = new THREE.PMREMGenerator(renderer);
			scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
			scene.environmentIntensity = 0.35;

			const camera = new THREE.PerspectiveCamera(28, 1, 0.05, 60);

			// Reason: a cool, even key from above. Passion: a red rim that follows the cursor.
			const hemi = new THREE.HemisphereLight(0xffffff, 0x2a2a2e, 0.9);
			const key = new THREE.DirectionalLight(0xffffff, 2.4);
			key.position.set(-2.5, 4, 3);
			const rim = new THREE.PointLight(accent, 26, 12, 1.6);
			rim.position.set(2.4, 0.8, -1.2);
			scene.add(hemi, key, rim);

			const marble = new THREE.MeshPhysicalMaterial({
				color: 0xf1efea,
				roughness: 0.6,
				metalness: 0,
				clearcoat: 0.15,
				clearcoatRoughness: 0.6,
				sheen: 0.4,
				sheenRoughness: 0.8,
				sheenColor: new THREE.Color(0xffffff)
			});

			const dust = createDust(THREE, isHero ? (small ? 700 : 1400) : 0);
			dust.material.uniforms.uPixelRatio.value = dpr;
			// Align the dust's downstream axis with the camera's right, so the current crosses the frame.
			dust.points.rotation.y = AZ;
			if (isHero) scene.add(dust.points);

			applyTheme = (dark, color) => {
				rim.color.set(color);
				// On the pale theme, less fill and a darker ground so the white stone keeps its form.
				hemi.intensity = dark ? 0.75 : 0.5;
				hemi.groundColor.set(dark ? 0x121214 : 0x4a4a52);
				key.intensity = dark ? 2.6 : 3.1;
				renderer.toneMappingExposure = dark ? 1.05 : 0.92;
				rim.intensity = dark ? 22 : 9;
				dust.setTheme(dark, color);
			};
			applyTheme(theme.current === 'dark', accent);

			let model: InstanceType<typeof THREE.Object3D>;
			try {
				const loader = new GLTFLoader();
				loader.setMeshoptDecoder(MeshoptDecoder);
				model = (await loader.loadAsync(src)).scene;
			} catch {
				if (import.meta.env.DEV) console.warn(`[Statue] ${src} not found. See static/models/README.md.`);
				status = 'missing';
				dust.dispose();
				renderer.dispose();
				renderer.domElement.remove();
				return;
			}
			if (disposed) return;

			// Normalise any scan: centre it, scale to 2 units tall, dress it in marble, and keep its
			// normal map, which holds the sculpted detail the geometry cannot.
			model.traverse((o) => {
				const mesh = o as InstanceType<typeof THREE.Mesh>;
				if (!mesh.isMesh) return;
				const original = mesh.material as InstanceType<typeof THREE.MeshStandardMaterial>;
				if (original.normalMap && !marble.normalMap) {
					marble.normalMap = original.normalMap;
					marble.normalScale.copy(original.normalScale);
					marble.needsUpdate = true;
				}
				mesh.material = marble;
				if (!mesh.geometry.attributes.normal) mesh.geometry.computeVertexNormals();
			});
			const box = new THREE.Box3().setFromObject(model);
			const size = box.getSize(new THREE.Vector3());
			model.position.sub(box.getCenter(new THREE.Vector3()));
			const holder = new THREE.Group();
			holder.add(model);
			holder.scale.setScalar(2 / size.y);
			scene.add(holder);

			// Motion state, all outside Svelte's reactivity.
			const rig = reduce ? { ...REST } : { ...CLOSE };
			const leave = { p: 0 };
			const pointer = { x: 0, y: 0 };
			const look = { x: 0, y: 0 };
			const target = new THREE.Vector3();
			let flow = 0;
			let last = performance.now();

			// Centred framing. Narrow screens pull back so the figure fits the width, and lift it so
			// the text band below has room.
			let fit = 1;
			const resize = () => {
				const { width, height } = host.getBoundingClientRect();
				const aspect = width / Math.max(height, 1);
				fit = isHero ? Math.max(1, 0.95 / aspect) : 1;
				renderer.setSize(width, height, false);
				camera.aspect = aspect;
				if (isHero && aspect < 0.95) camera.setViewOffset(width, height, 0, height * 0.2, width, height);
				else camera.clearViewOffset();
				camera.updateProjectionMatrix();
			};
			resize();
			const ro = new ResizeObserver(resize);
			ro.observe(host);

			const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

			const render = (t = 0) => {
				const dt = Math.min((t - last) / 1000, 0.05);
				last = t;
				// The air moves faster while the visitor scrolls: the river runs because you do.
				flow += dt * (1 + Math.min(Math.abs(scroll.velocity) * 0.08, 6));
				dust.material.uniforms.uTime.value = flow;

				look.x += (pointer.x - look.x) * 0.035;
				look.y += (pointer.y - look.y) * 0.035;
				const p = leave.p;
				const r = lerp(rig.r, LEAVE.r, p) * fit;
				target.set(aim.x, lerp(rig.ty, LEAVE.ty, p), aim.z);
				camera.position.set(
					target.x + r * Math.cos(EL) * Math.sin(AZ),
					target.y + r * Math.sin(EL),
					target.z + r * Math.cos(EL) * Math.cos(AZ)
				);
				camera.lookAt(target);

				// The red light stays behind the figure and swings toward whichever side the cursor is on,
				// so it only ever catches the edges.
				const rimAz = AZ + Math.PI - 0.9 * look.x;
				rim.position.set(Math.sin(rimAz) * 3, 1.1 - look.y * 1.2, Math.cos(rimAz) * 3);
				renderer.render(scene, camera);
			};

			status = 'ready';

			if (reduce) {
				dust.material.uniforms.uOpacity.value = 0.8;
				render();
				cleanup = () => {
					ro.disconnect();
					dust.dispose();
					renderer.dispose();
					pmrem.dispose();
					marble.dispose();
				};
				return;
			}

			playEntrance = () => {
				playEntrance = null;
				// Fade the canvas, not the material: a translucent scan would show its inner faces.
				gsap
					.timeline()
					.to(host, { opacity: 1, duration: 1.6, ease: 'power2.out' }, 0)
					.to(dust.material.uniforms.uOpacity, { value: 1, duration: 3, ease: 'power2.out' }, 0.2)
					// Hold on the head for a breath, then pull back to the full figure.
					.to(rig, { ...REST, duration: 4.2, ease: 'expo.inOut' }, 0.5);
			};
			// The hero enters with the intro curtain; the portrait enters when it is first seen.
			let seen: IntersectionObserver | null = null;
			if (isHero) {
				if (intro.done) playEntrance();
			} else {
				seen = new IntersectionObserver(([entry]) => {
					if (!entry.isIntersecting) return;
					playEntrance?.();
					seen?.disconnect();
				}, { threshold: 0.25 });
				seen.observe(host);
			}

			const leaveTween = gsap.to(leave, {
				p: 1,
				ease: 'none',
				scrollTrigger: isHero
					? { trigger: host, start: 'top top', end: 'bottom top', scrub: 1 }
					: { trigger: host, start: 'top bottom', end: 'bottom top', scrub: 1 }
			});

			const onMove = (e: PointerEvent) => {
				pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
				pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
			};
			window.addEventListener('pointermove', onMove, { passive: true });

			let raf = 0;
			const loop = (t: number) => {
				render(t);
				raf = requestAnimationFrame(loop);
			};
			const io = new IntersectionObserver(([entry]) => {
				cancelAnimationFrame(raf);
				if (entry.isIntersecting) {
					last = performance.now();
					raf = requestAnimationFrame(loop);
				}
			});
			io.observe(host);


			cleanup = () => {
				cancelAnimationFrame(raf);
				io.disconnect();
				seen?.disconnect();
				ro.disconnect();
				window.removeEventListener('pointermove', onMove);
				leaveTween.scrollTrigger?.kill();
				leaveTween.kill();
				dust.dispose();
				renderer.dispose();
				pmrem.dispose();
				marble.dispose();
			};
		})();

		return () => {
			disposed = true;
			applyTheme = null;
			playEntrance = null;
			cleanup();
		};
	});
</script>

<div class="statue" data-status={status} bind:this={host} aria-hidden="true"></div>

<style>
	.statue {
		position: absolute;
		inset: 0;
	}

	:global(.js) .statue {
		opacity: 0;
	}

	@media (prefers-reduced-motion: reduce) {
		:global(.js) .statue {
			opacity: 1;
		}
	}

	.statue :global(canvas) {
		display: block;
		width: 100%;
		height: 100%;
	}
</style>
