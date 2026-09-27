// Small live drawings, one per project, each showing what the project does rather than what it
// looks like. Monochrome ink plus the single accent. Every drawing is a pure function of its own
// state and the frame time, so it can be paused, resized or advanced offscreen.

export type Palette = { ink: string; muted: string; line: string; accent: string; bg: string };

export type Sketch = {
	resize(w: number, h: number): void;
	/** Advance by dt seconds and draw. `speed` rises while the card is hovered. */
	frame(dt: number, p: Palette, speed: number): void;
};

type Factory = (ctx: CanvasRenderingContext2D) => Sketch;

const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/** RustForge RL: a DQN-style agent keeps CartPole upright while its reward curve climbs. */
const cartpole: Factory = (ctx) => {
	let w = 0;
	let h = 0;
	let x = 0;
	let v = 0;
	let th = 0.12;
	let om = 0;
	let kick = 0;
	let t = 0;
	const trail: { x: number; y: number }[] = [];
	const reward: number[] = [];

	return {
		resize(nw, nh) {
			w = nw;
			h = nh;
		},
		frame(dt, p, speed) {
			const steps = 4;
			const sdt = (dt * speed) / steps;
			for (let i = 0; i < steps; i++) {
				kick -= sdt;
				if (kick <= 0) {
					om += rand(-1.3, 1.3);
					kick = rand(1.6, 3);
				}
				const u = clamp(40 * th + 10 * om + 2 * x + 3.5 * v, -25, 25);
				v += u * sdt;
				x += v * sdt;
				om += (9.8 * Math.sin(th) - u * Math.cos(th)) * sdt;
				th += om * sdt;
			}
			t += dt * speed;

			// Reward curve: rises with learning, then the run restarts.
			if (reward.length > 160) reward.length = 0;
			const n = reward.length;
			reward.push(1 - Math.exp(-n / 45) + rand(-0.08, 0.08) * Math.exp(-n / 90));

			const s = Math.min(w, h);
			const trackY = h * 0.78;
			const cx = w / 2 + clamp(x, -1.2, 1.2) * w * 0.3;
			const L = s * 0.42;
			const tipX = cx + Math.sin(th) * L;
			const tipY = trackY - s * 0.05 - Math.cos(th) * L;

			ctx.clearRect(0, 0, w, h);

			// learning curve across the top
			ctx.strokeStyle = p.muted;
			ctx.globalAlpha = 0.55;
			ctx.lineWidth = 1;
			ctx.beginPath();
			reward.forEach((r, i) => {
				const px = w * 0.08 + (i / 160) * w * 0.84;
				const py = h * 0.3 - r * h * 0.2;
				if (i === 0) ctx.moveTo(px, py);
				else ctx.lineTo(px, py);
			});
			ctx.stroke();
			ctx.globalAlpha = 1;

			// track and ticks
			ctx.strokeStyle = p.line;
			ctx.beginPath();
			ctx.moveTo(w * 0.08, trackY);
			ctx.lineTo(w * 0.92, trackY);
			for (let i = 0; i <= 10; i++) {
				const tx = w * 0.08 + (i / 10) * w * 0.84;
				ctx.moveTo(tx, trackY);
				ctx.lineTo(tx, trackY + 5);
			}
			ctx.stroke();

			// ghost poles: where it has just been
			trail.push({ x: tipX, y: tipY });
			if (trail.length > 26) trail.shift();
			trail.forEach((pt, i) => {
				ctx.globalAlpha = (i / trail.length) * 0.18;
				ctx.strokeStyle = p.accent;
				ctx.beginPath();
				ctx.moveTo(cx, trackY - s * 0.05);
				ctx.lineTo(pt.x, pt.y);
				ctx.stroke();
			});
			ctx.globalAlpha = 1;

			// cart
			const cw = s * 0.16;
			const ch = s * 0.07;
			ctx.fillStyle = p.bg;
			ctx.strokeStyle = p.ink;
			ctx.lineWidth = 1.25;
			ctx.fillRect(cx - cw / 2, trackY - ch, cw, ch);
			ctx.strokeRect(cx - cw / 2, trackY - ch, cw, ch);

			// pole
			ctx.strokeStyle = p.accent;
			ctx.lineWidth = 2.5;
			ctx.beginPath();
			ctx.moveTo(cx, trackY - s * 0.05);
			ctx.lineTo(tipX, tipY);
			ctx.stroke();
			ctx.fillStyle = p.ink;
			ctx.beginPath();
			ctx.arc(cx, trackY - s * 0.05, 3, 0, Math.PI * 2);
			ctx.fill();
			ctx.lineWidth = 1;
		}
	};
};

/** ETL pipeline: messy raw rows pass through the Rust engine and leave as ordered columns. */
const etl: Factory = (ctx) => {
	let w = 0;
	let h = 0;
	let spawn = 0;
	type Row = { x: number; y: number; len: number; lane: number; vx: number; jitter: number };
	const rows: Row[] = [];
	const LANES = 6;

	return {
		resize(nw, nh) {
			w = nw;
			h = nh;
		},
		frame(dt, p, speed) {
			const gate = w * 0.5;
			const laneY = (i: number) => h * 0.2 + (i / (LANES - 1)) * h * 0.6;
			spawn -= dt * speed;
			while (spawn <= 0) {
				rows.push({
					x: -20,
					y: rand(h * 0.14, h * 0.86),
					len: rand(6, 26),
					lane: Math.floor(rand(0, LANES)),
					vx: rand(0.09, 0.15) * w,
					jitter: rand(0, 6.28)
				});
				spawn += 0.035;
			}

			ctx.clearRect(0, 0, w, h);

			// output lanes: columnar storage
			ctx.strokeStyle = p.line;
			ctx.lineWidth = 1;
			ctx.beginPath();
			for (let i = 0; i < LANES; i++) {
				ctx.moveTo(gate, laneY(i));
				ctx.lineTo(w, laneY(i));
			}
			ctx.stroke();

			for (let i = rows.length - 1; i >= 0; i--) {
				const r = rows[i];
				const past = r.x > gate;
				// the Rust engine moves data much faster once it is inside
				r.x += r.vx * (past ? 2.4 : 1) * dt * speed;
				r.jitter += dt * 3;
				if (past) r.y += (laneY(r.lane) - r.y) * Math.min(1, dt * 9);
				if (r.x > w + 30) {
					rows.splice(i, 1);
					continue;
				}
				if (past) {
					ctx.fillStyle = p.ink;
					ctx.fillRect(r.x - 2.5, r.y - 2.5, 5, 5);
				} else {
					ctx.strokeStyle = p.muted;
					ctx.globalAlpha = 0.75;
					ctx.beginPath();
					const y = r.y + Math.sin(r.jitter) * 1.5;
					ctx.moveTo(r.x - r.len, y);
					ctx.lineTo(r.x, y);
					ctx.stroke();
					ctx.globalAlpha = 1;
				}
			}

			// the engine: a hard line where disorder becomes order
			ctx.strokeStyle = p.accent;
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.moveTo(gate, h * 0.1);
			ctx.lineTo(gate, h * 0.9);
			ctx.stroke();
			ctx.lineWidth = 1;
			for (let i = 0; i < 20; i++) {
				const y = h * 0.12 + (i / 19) * h * 0.76;
				ctx.beginPath();
				ctx.moveTo(gate - 4, y);
				ctx.lineTo(gate + 4, y);
				ctx.stroke();
			}
		}
	};
};

/** Anti-cheat: a human cursor wanders and corrects; a bot's line is too perfect, and is flagged. */
const aimbot: Factory = (ctx) => {
	let w = 0;
	let h = 0;
	let tx = 0.5;
	let ty = 0.4;
	let timer = 0;
	const human = { x: 0.2, y: 0.5, vx: 0, vy: 0, trail: [] as { x: number; y: number }[] };
	const bot = { x: 0.8, y: 0.3, sx: 0.8, sy: 0.3, k: 0, trail: [] as { x: number; y: number }[] };
	let flash = 0;

	const retarget = () => {
		tx = rand(0.15, 0.85);
		ty = rand(0.12, 0.62);
		bot.sx = bot.x;
		bot.sy = bot.y;
		bot.k = 0;
		timer = rand(1.3, 1.9);
	};

	const drawTrail = (pts: { x: number; y: number }[], colour: string, width: number) => {
		ctx.strokeStyle = colour;
		ctx.lineWidth = width;
		for (let i = 1; i < pts.length; i++) {
			ctx.globalAlpha = (i / pts.length) * 0.9;
			ctx.beginPath();
			ctx.moveTo(pts[i - 1].x * w, pts[i - 1].y * h);
			ctx.lineTo(pts[i].x * w, pts[i].y * h);
			ctx.stroke();
		}
		ctx.globalAlpha = 1;
		ctx.lineWidth = 1;
	};

	return {
		resize(nw, nh) {
			w = nw;
			h = nh;
		},
		frame(dt, p, speed) {
			const d = dt * speed;
			timer -= d;
			if (timer <= 0) retarget();

			// human: a damped spring with tremor and overshoot
			const ax = (tx - human.x) * 26 - human.vx * 6.5 + rand(-1, 1) * 2.2;
			const ay = (ty - human.y) * 26 - human.vy * 6.5 + rand(-1, 1) * 2.2;
			human.vx += ax * d;
			human.vy += ay * d;
			human.x += human.vx * d;
			human.y += human.vy * d;

			// bot: a straight line at constant speed, then dead still
			bot.k = Math.min(1, bot.k + d * 2.2);
			bot.x = bot.sx + (tx - bot.sx) * bot.k;
			bot.y = bot.sy + (ty - bot.sy) * bot.k;
			if (bot.k >= 1 && flash <= 0) flash = 0.6;
			flash -= d;

			for (const a of [human, bot]) {
				a.trail.push({ x: a.x, y: a.y });
				if (a.trail.length > 70) a.trail.shift();
			}

			ctx.clearRect(0, 0, w, h);

			// target
			ctx.strokeStyle = p.muted;
			ctx.beginPath();
			ctx.arc(tx * w, ty * h, 9, 0, Math.PI * 2);
			ctx.moveTo(tx * w - 14, ty * h);
			ctx.lineTo(tx * w + 14, ty * h);
			ctx.moveTo(tx * w, ty * h - 14);
			ctx.lineTo(tx * w, ty * h + 14);
			ctx.stroke();

			drawTrail(human.trail, p.ink, 1.75);
			drawTrail(bot.trail, p.accent, 1.75);

			// cursors; the bot is marked with a cross
			ctx.fillStyle = p.ink;
			ctx.beginPath();
			ctx.arc(human.x * w, human.y * h, 3.5, 0, Math.PI * 2);
			ctx.fill();
			const bx = bot.x * w;
			const by = bot.y * h;
			ctx.strokeStyle = p.accent;
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.moveTo(bx - 5, by - 5);
			ctx.lineTo(bx + 5, by + 5);
			ctx.moveTo(bx + 5, by - 5);
			ctx.lineTo(bx - 5, by + 5);
			ctx.stroke();
			if (flash > 0) {
				ctx.globalAlpha = flash;
				ctx.beginPath();
				ctx.arc(bx, by, 14 + (0.6 - flash) * 30, 0, Math.PI * 2);
				ctx.stroke();
				ctx.globalAlpha = 1;
			}
			ctx.lineWidth = 1;

			// reconstruction error: human sits low, the bot lands past the threshold
			const my = h * 0.86;
			const x0 = w * 0.08;
			const x1 = w * 0.92;
			ctx.strokeStyle = p.line;
			ctx.beginPath();
			ctx.moveTo(x0, my);
			ctx.lineTo(x1, my);
			ctx.stroke();
			const thr = x0 + (x1 - x0) * 0.72;
			ctx.strokeStyle = p.accent;
			ctx.setLineDash([3, 3]);
			ctx.beginPath();
			ctx.moveTo(thr, my - 12);
			ctx.lineTo(thr, my + 12);
			ctx.stroke();
			ctx.setLineDash([]);
			const hSpeed = Math.hypot(human.vx, human.vy);
			ctx.fillStyle = p.ink;
			ctx.beginPath();
			ctx.arc(x0 + (x1 - x0) * clamp(0.12 + hSpeed * 0.04, 0.08, 0.3), my, 4, 0, Math.PI * 2);
			ctx.fill();
			ctx.fillStyle = p.accent;
			ctx.beginPath();
			ctx.arc(x0 + (x1 - x0) * (0.86 + Math.sin(performance.now() / 700) * 0.03), my, 4, 0, Math.PI * 2);
			ctx.fill();
		}
	};
};

/** Experiment Observatory: data arrives, a line learns to fit it, the loss falls, then a new run. */
const observatory: Factory = (ctx) => {
	let w = 0;
	let h = 0;
	let pts: { x: number; y: number }[] = [];
	let m = 0;
	let c = 0.5;
	let shown = 0;
	let hold = 0;
	let loss: number[] = [];

	const reset = () => {
		const a = rand(-0.7, 0.7);
		const b = rand(0.35, 0.65) - a / 2;
		pts = Array.from({ length: 26 }, () => {
			const x = rand(0.03, 0.97);
			return { x, y: clamp(a * x + b + rand(-0.09, 0.09), 0.02, 0.98) };
		});
		m = rand(-0.8, 0.8);
		c = rand(0.2, 0.8);
		shown = 0;
		hold = 0;
		loss = [];
	};
	reset();

	return {
		resize(nw, nh) {
			w = nw;
			h = nh;
		},
		frame(dt, p, speed) {
			const d = dt * speed;
			shown = Math.min(pts.length, shown + d * 30);
			if (shown >= pts.length) {
				// Gradient descent on mean squared error. The step stays below 2 / (largest Hessian
				// eigenvalue, about 2.8 here) so the fit settles instead of diverging; hovering adds steps.
				const steps = speed > 1.5 ? 2 : 1;
				for (let k = 0; k < steps; k++) {
					let gm = 0;
					let gc = 0;
					let l = 0;
					for (const pt of pts) {
						const e = m * pt.x + c - pt.y;
						gm += e * pt.x;
						gc += e;
						l += e * e;
					}
					const n = pts.length;
					m -= 0.6 * 2 * (gm / n);
					c -= 0.6 * 2 * (gc / n);
					if (loss.length < 120) loss.push(l / n);
				}
				if (loss.length >= 120) hold += d;
				if (hold > 1.4) reset();
			}

			const px = (x: number) => w * 0.1 + x * w * 0.62;
			const py = (y: number) => h * 0.88 - y * h * 0.72;

			ctx.clearRect(0, 0, w, h);

			// axes
			ctx.strokeStyle = p.line;
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.moveTo(px(0), py(1));
			ctx.lineTo(px(0), py(0));
			ctx.lineTo(px(1), py(0));
			ctx.stroke();

			const visible = pts.slice(0, Math.floor(shown));
			const fitting = shown >= pts.length;

			// residuals, the error being minimised
			if (fitting) {
				ctx.strokeStyle = p.muted;
				ctx.globalAlpha = 0.45;
				ctx.beginPath();
				for (const pt of visible) {
					ctx.moveTo(px(pt.x), py(pt.y));
					ctx.lineTo(px(pt.x), py(m * pt.x + c));
				}
				ctx.stroke();
				ctx.globalAlpha = 1;
			}

			ctx.fillStyle = p.ink;
			for (const pt of visible) {
				ctx.beginPath();
				ctx.arc(px(pt.x), py(pt.y), 2.8, 0, Math.PI * 2);
				ctx.fill();
			}

			if (fitting) {
				ctx.save();
				ctx.beginPath();
				ctx.rect(px(0), py(1), px(1) - px(0), py(0) - py(1));
				ctx.clip();
				ctx.strokeStyle = p.accent;
				ctx.lineWidth = 2;
				ctx.beginPath();
				ctx.moveTo(px(0), py(c));
				ctx.lineTo(px(1), py(m + c));
				ctx.stroke();
				ctx.restore();
			}

			// loss curve, top right
			const lx = w * 0.78;
			const lw = w * 0.16;
			const ly = h * 0.16;
			const lh = h * 0.28;
			ctx.strokeStyle = p.line;
			ctx.beginPath();
			ctx.moveTo(lx, ly);
			ctx.lineTo(lx, ly + lh);
			ctx.lineTo(lx + lw, ly + lh);
			ctx.stroke();
			if (loss.length > 1) {
				const top = loss[0] || 1;
				ctx.strokeStyle = p.accent;
				ctx.beginPath();
				loss.forEach((l, i) => {
					const x = lx + (i / 119) * lw;
					const y = ly + lh - clamp(l / top, 0, 1) * lh;
					if (i === 0) ctx.moveTo(x, y);
					else ctx.lineTo(x, y);
				});
				ctx.stroke();
			}
		}
	};
};

/** Manifest Lens: fields on the instruction and the bill are compared row by row; mismatches go to review. */
const manifest: Factory = (ctx) => {
	let w = 0;
	let h = 0;
	let rows: { a: number; b: number; ok: boolean }[] = [];
	let progress = 0;
	let hold = 0;

	const reset = () => {
		rows = Array.from({ length: 7 }, () => {
			const a = rand(0.35, 0.95);
			const ok = Math.random() > 0.28;
			return { a, b: ok ? a : clamp(a + rand(0.2, 0.35) * (Math.random() > 0.5 ? 1 : -1), 0.2, 1), ok };
		});
		if (rows.every((r) => r.ok)) rows[3] = { a: 0.8, b: 0.45, ok: false };
		progress = 0;
		hold = 0;
	};
	reset();

	return {
		resize(nw, nh) {
			w = nw;
			h = nh;
		},
		frame(dt, p, speed) {
			const d = dt * speed;
			if (progress < rows.length) progress = Math.min(rows.length, progress + d * 1.6);
			else if ((hold += d) > 1.6) reset();

			const colW = w * 0.3;
			const leftX = w * 0.08;
			const rightX = w * 0.62;
			const top = h * 0.2;
			const gap = (h * 0.68) / rows.length;

			ctx.clearRect(0, 0, w, h);
			ctx.font = '11px "Geist Mono Variable", ui-monospace, monospace';
			ctx.fillStyle = p.muted;
			ctx.fillText('SHIPPING INSTRUCTION', leftX, h * 0.12);
			ctx.fillText('BILL OF LADING', rightX, h * 0.12);

			rows.forEach((r, i) => {
				const y = top + i * gap;
				// label stub and value bar in each document
				ctx.fillStyle = p.line;
				ctx.fillRect(leftX, y, colW * 0.22, 4);
				ctx.fillRect(rightX, y, colW * 0.22, 4);
				ctx.fillStyle = p.muted;
				ctx.globalAlpha = 0.6;
				ctx.fillRect(leftX + colW * 0.28, y, colW * 0.72 * r.a, 4);
				ctx.fillRect(rightX + colW * 0.28, y, colW * 0.72 * r.b, 4);
				ctx.globalAlpha = 1;

				const local = clamp(progress - i, 0, 1);
				if (local <= 0) return;
				const x0 = leftX + colW + 8;
				const x1 = rightX - 8;
				ctx.strokeStyle = r.ok ? p.ink : p.accent;
				if (!r.ok) ctx.setLineDash([4, 3]);
				ctx.beginPath();
				ctx.moveTo(x0, y + 2);
				ctx.lineTo(x0 + (x1 - x0) * local, y + 2);
				ctx.stroke();
				ctx.setLineDash([]);

				if (local >= 1) {
					const mx = w * 0.96;
					if (r.ok) {
						ctx.strokeStyle = p.ink;
						ctx.lineWidth = 1.5;
						ctx.beginPath();
						ctx.moveTo(mx - 9, y + 2);
						ctx.lineTo(mx - 5, y + 6);
						ctx.lineTo(mx + 2, y - 3);
						ctx.stroke();
						ctx.lineWidth = 1;
					} else {
						// sent to a human reviewer
						ctx.fillStyle = p.accent;
						ctx.fillRect(mx - 9, y - 3, 10, 10);
						ctx.fillStyle = p.accent;
						ctx.globalAlpha = 0.12;
						ctx.fillRect(rightX - 4, y - 6, w * 0.96 - rightX + 6, 16);
						ctx.globalAlpha = 1;
					}
				}
			});

			// scan line
			if (progress < rows.length) {
				const sy = top + progress * gap - gap * 0.4;
				ctx.strokeStyle = p.accent;
				ctx.globalAlpha = 0.35;
				ctx.beginPath();
				ctx.moveTo(leftX, sy);
				ctx.lineTo(w * 0.96, sy);
				ctx.stroke();
				ctx.globalAlpha = 1;
			}
		}
	};
};

/** Command Center: the orchestrator fans work out to six agents and back; a failed claim goes to a human. */
const agents: Factory = (ctx) => {
	let w = 0;
	let h = 0;
	let t = 0;
	let failing = -1;

	const cycle = 4;
	const newCycle = () => {
		failing = Math.random() < 0.55 ? Math.floor(rand(0, 6)) : -1;
	};
	newCycle();

	return {
		resize(nw, nh) {
			w = nw;
			h = nh;
		},
		frame(dt, p, speed) {
			const prev = t % cycle;
			t += dt * speed;
			const phase = t % cycle;
			if (phase < prev) newCycle();

			const s = Math.min(w, h);
			const cx = w / 2;
			const cy = h * 0.42;
			const R = s * 0.3;
			const human = { x: w / 2, y: h * 0.9 };
			const nodes = Array.from({ length: 6 }, (_, i) => {
				const a = -Math.PI / 2 + (i / 6) * Math.PI * 2;
				return { x: cx + Math.cos(a) * R * 1.25, y: cy + Math.sin(a) * R };
			});

			ctx.clearRect(0, 0, w, h);

			// edges
			ctx.strokeStyle = p.line;
			ctx.lineWidth = 1;
			ctx.beginPath();
			for (const n of nodes) {
				ctx.moveTo(cx, cy);
				ctx.lineTo(n.x, n.y);
			}
			ctx.stroke();
			if (failing >= 0 && phase > 2) {
				ctx.strokeStyle = p.accent;
				ctx.setLineDash([4, 4]);
				ctx.beginPath();
				ctx.moveTo(nodes[failing].x, nodes[failing].y);
				ctx.lineTo(human.x, human.y);
				ctx.stroke();
				ctx.setLineDash([]);
			}

			const pulse = (ax: number, ay: number, bx: number, by: number, k: number, colour: string) => {
				ctx.fillStyle = colour;
				ctx.beginPath();
				ctx.arc(ax + (bx - ax) * k, ay + (by - ay) * k, 3, 0, Math.PI * 2);
				ctx.fill();
			};

			nodes.forEach((n, i) => {
				// fan out (0 to 1s), work (1 to 2s), fan in or escalate (2 to 3s)
				if (phase < 1) pulse(cx, cy, n.x, n.y, phase, p.ink);
				else if (phase > 2 && phase < 3) {
					if (i === failing) pulse(n.x, n.y, human.x, human.y, phase - 2, p.accent);
					else pulse(n.x, n.y, cx, cy, phase - 2, p.ink);
				}
				const working = phase >= 1 && phase < 2;
				const failed = i === failing && phase >= 1.6;
				ctx.fillStyle = failed ? p.accent : working ? p.ink : p.bg;
				ctx.strokeStyle = failed ? p.accent : p.ink;
				ctx.lineWidth = 1.25;
				ctx.beginPath();
				ctx.arc(n.x, n.y, s * 0.028, 0, Math.PI * 2);
				ctx.fill();
				ctx.stroke();
			});

			// orchestrator
			ctx.fillStyle = p.bg;
			ctx.strokeStyle = p.ink;
			ctx.lineWidth = 1.5;
			ctx.beginPath();
			ctx.arc(cx, cy, s * 0.05, 0, Math.PI * 2);
			ctx.fill();
			ctx.stroke();
			ctx.fillStyle = p.accent;
			ctx.beginPath();
			ctx.arc(cx, cy, s * 0.016, 0, Math.PI * 2);
			ctx.fill();

			// the human reviewer: filled while a flagged claim waits for a decision
			const reviewing = failing >= 0 && phase > 3;
			const hs = s * 0.05;
			ctx.fillStyle = reviewing ? p.accent : p.bg;
			ctx.strokeStyle = failing >= 0 && phase > 2 ? p.accent : p.muted;
			ctx.fillRect(human.x - hs / 2, human.y - hs / 2, hs, hs);
			ctx.strokeRect(human.x - hs / 2, human.y - hs / 2, hs, hs);
			ctx.lineWidth = 1;
		}
	};
};

export const sketches = { cartpole, etl, aimbot, observatory, manifest, agents } as const;
export type SketchKind = keyof typeof sketches;
