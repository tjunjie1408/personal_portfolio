// All visible copy lives here, taken from the CV, LinkedIn and project READMEs (temporary);
// update this file when they change. Images are still placeholders.

import type { SketchKind } from './sketches';

const github = 'https://github.com/tjunjie1408';

export const site = {
	/** Production origin, used for canonical and share links. Update it if the domain changes. */
	url: 'https://teojunjie.vercel.app',
	name: 'Teo Jun Jie',
	role: 'Software engineer, AI and machine learning',
	email: 'jasonteo1408@gmail.com',
	github,
	description:
		'Software engineering student specialising in AI and systems programming, with a particular interest in fast, secure systems.'
};

export const nav = [
	{ label: 'Principles', href: '#principles' },
	{ label: 'About', href: '#about' },
	{ label: 'Education', href: '#education' },
	{ label: 'Experience', href: '#experience' },
	{ label: 'Work', href: '#work' },
	{ label: 'Toolkit', href: '#toolkit' },
	{ label: 'Writing', href: '/blog' }
];

export const hero = {
	// Each entry is one line; `em` renders in italic.
	lines: [{ text: 'I build things' }, { text: 'to ', em: 'understand', after: ' them.' }],
	sub: 'I’m Teo Jun Jie, a software engineering student working on AI and systems programming, drawn to fast, secure systems.',
	primary: { label: 'View work', href: '#work' },
	secondary: { label: 'Write to me', href: '#contact' }
};

// The two ideas the whole site is built around.
export const quotes = {
	river: {
		text: 'No one ever steps in the same river twice.',
		cite: 'Heraclitus, as recorded by Plato in the Cratylus'
	},
	passion: {
		text: 'Reason is, and ought only to be, the slave of the passions.',
		cite: 'David Hume, A Treatise of Human Nature, 1739'
	}
};

export const premise =
	'Curiosity chooses the problem. Reason works out the solution. By the time it ships, the problem has moved and so have I, which is why I build things to be rebuilt.';

// Numbered in the manner of Wittgenstein's Tractatus: n is a claim, n.1 its elaboration.
// 1 and 2 follow the river, 3 and 4 follow the passions.
export const propositions = [
	{
		n: '1',
		claim: 'Nothing stays built.',
		sub: 'Requirements are a river: by the time the code ships, the problem has already moved.'
	},
	{
		n: '2',
		claim: 'Every return is a first visit.',
		sub: 'I reread my old code as a stranger, because I am one.'
	},
	{
		n: '3',
		claim: 'Passion leads, reason serves.',
		sub: 'Curiosity picks the problem. Rigour decides how it gets solved.'
	},
	{
		n: '4',
		claim: 'Measure what you care about.',
		sub: 'Desire sets the target. Evidence keeps the aim honest.'
	}
];

export type Project = {
	title: string;
	kind: string;
	summary: string;
	/** Why the project exists. */
	context: string;
	/** What was actually built, step by step. */
	approach: string[];
	/** Results from the README or CV, one sentence each. **Double asterisks** mark the figure. */
	outcomes: string[];
	/** Names must match the toolkit below, so selecting a tool can find its projects. */
	tools: string[];
	/** The live drawing shown as the cover (see src/lib/sketches). */
	sketch: SketchKind;
	/** A real screenshot, if one exists; it replaces the drawing. */
	image: string | null;
	imageAlt?: string;
	href: string;
};

const repo = (name: string) => `${github}/${name}`;

export const projects: Project[] = [
	{
		title: 'RustForge RL',
		kind: 'Reinforcement learning in Rust',
		summary:
			'A reinforcement learning framework written from scratch in Rust: tensors, autograd, neural networks and seven algorithms. On CartPole it trains about 22x faster than Stable-Baselines3.',
		context:
			'Most reinforcement learning runs on Python frameworks. RustForge asks what the whole stack looks like when it is built from the ground up in Rust, and how much faster it can be.',
		approach: [
			'Built a PyTorch-style tensor engine with 51 operations, from creation and reshaping to matrix multiplication, reductions and activations.',
			'Added a dynamic autograd graph with 17 gradient mappings, and SGD and Adam optimisers.',
			'Implemented neural network modules (Linear, Conv2d, BatchNorm, LayerNorm) with MSE, cross-entropy and Huber losses.',
			'Implemented DQN, Double DQN, REINFORCE, A2C, PPO, TD3 and SAC, with CartPole, GridWorld, MountainCar and Pendulum environments.',
			'Kept a strict one-way crate structure (tensor, autograd, nn, rl), with a CLI, a terminal training monitor and Python bindings through PyO3.'
		],
		outcomes: [
			'Trains about **22x faster** than Stable-Baselines3 on CartPole, with a matched configuration on CPU.',
			'**Seven algorithms**, from value-based DQN to continuous-control SAC, on one engine.'
		],
		tools: ['Rust', 'Python', 'Reinforcement learning'],
		sketch: 'cartpole',
		image: null,
		href: repo('RustForge-RL')
	},
	{
		title: 'Experiment Observatory',
		kind: 'MLOps, a lifelong archive',
		summary:
			'A living archive of machine learning experiments. Every training run is recorded step by step and replayed in the browser, from raw data to fitted model. It grows with each new experiment.',
		context:
			'A trained model usually leaves behind one number and nothing else. Observatory keeps the whole story, so any experiment can be rerun, inspected and watched again. It is a lifelong project, updated as I learn.',
		approach: [
			'Versioned datasets with DVC and a Google Drive remote; dvc repro rebuilds and validates every pipeline.',
			'Recorded each training run as an exact timeline of events and snapshots, so it can be replayed later.',
			'Tracked finished runs in MLflow, with Parquet and DuckDB as a local analysis warehouse.',
			'Built a Svelte 5 frontend that replays training live, showing predictions, failures and model fit, streamed from a FastAPI service over server-sent events.',
			'Kept everything reproducible with locked uv environments, ruff, mypy and pytest.'
		],
		outcomes: [
			'**Three model families** so far: linear regression, K-means and CART decision trees.',
			'Every run can be **replayed step by step** in the browser, from first batch to final fit.'
		],
		tools: ['Python', 'Svelte', 'FastAPI', 'DVC', 'MLflow', 'DuckDB'],
		sketch: 'observatory',
		image: null,
		href: repo('Experiment-Observatory')
	},
	{
		title: 'Manifest Lens',
		kind: 'Applied AI, human in the loop',
		summary:
			'Checks shipping instructions against draft bills of lading with a local model. Clean matches are approved automatically; every discrepancy goes to a human reviewer.',
		context:
			'Before cargo leaves port, the shipping instruction and the draft bill of lading must agree. Mismatches are expensive, and a model that guesses is worse than one that asks.',
		approach: [
			'Triaged incoming email with a local multilingual-e5-small embedding model: explicit shipping rules decide the clear cases, and the model resolves only the ambiguous ones.',
			'Kept field extraction and the SI against BL comparison deterministic. Missing or ambiguous evidence goes to a person instead of being inferred.',
			'Froze every prediction and model revision in an audit file, so each decision can be reproduced.',
			'Built a SvelteKit review interface with evidence maps and side-by-side fields; reviewer corrections are stored in PostgreSQL through Drizzle.'
		],
		outcomes: [
			'**520 emails** processed in the audited experiment, every decision reproducible.',
			'**No paid APIs**: the model runs locally.'
		],
		tools: ['Python', 'TypeScript', 'SvelteKit', 'PostgreSQL', 'Docker', 'Embeddings'],
		sketch: 'manifest',
		image: null,
		href: repo('manifest-lens')
	},
	{
		title: 'Onboarding and Retention Command Center',
		kind: 'Agent workflows for HR',
		summary:
			'Automates 90-day onboarding and retention work with an orchestrator and six specialist agents, then checks every claim they make against policy before anything leaves the system.',
		context:
			'An agent that reports success is making a claim, not stating a fact. The Command Center automates the HR workload, and verifies the agents before it trusts them.',
		approach: [
			'Orchestrated one coordinator and six specialist operators on Supervity Auto, with parallel fan-out, fan-in and fast-fail branches.',
			'Detected exceptions from four independent signals: failed steps, silent retries, operator review requests and failure counters.',
			'Evaluated every action against editable policy rules that need no code changes.',
			'Routed exceptions to a human workbench for approval, with live OneDrive, Jira, Outlook and Zoom integrations and a full audit log.'
		],
		outcomes: [
			'**Seven agents**: one orchestrator and six specialists.',
			'**Four independent failure signals** are checked before any action leaves the system.'
		],
		tools: ['Python', 'FastAPI', 'PostgreSQL', 'TypeScript', 'Docker', 'AI agents'],
		sketch: 'agents',
		image: null,
		href: repo('Onboarding-Retention-Command-Center')
	},
	{
		title: 'High-Throughput ETL Pipeline',
		kind: 'Data engineering',
		summary:
			'A local data lake on MinIO and DuckDB. A parallel Rust processor runs 15x faster than the Pandas baseline, and Parquet output cuts storage by 60%.',
		context:
			'Enterprise data platforms are expensive to experiment with. This pipeline reproduces the whole shape of one, storage, compute and orchestration, on a single machine with no cloud bill.',
		approach: [
			'Built a local data lake on MinIO (S3 compatible), with DuckDB as the query engine.',
			'Wrote the heavy transform step as a custom Rust processor, parallelised with Rayon.',
			'Orchestrated the workflow in Python with Prefect: automated retries, dependency management and data-quality checks with Great Expectations.',
			'Converted raw log data into optimised, columnar Parquet.'
		],
		outcomes: [
			'Processes data **15x faster** than the standard Pandas scripts it replaced.',
			'Moving raw logs to Parquet made the storage footprint **60% smaller**.'
		],
		tools: ['Rust', 'Python', 'SQL', 'DuckDB', 'Prefect', 'Docker'],
		sketch: 'etl',
		image: null,
		href: repo('ETL-pipe')
	},
	{
		title: 'AI-Powered Anti-Cheat',
		kind: 'Security and ML',
		summary:
			'Behavioural biometrics for games: Rust tools capture mouse telemetry, and an LSTM autoencoder flags movement that does not look human.',
		context:
			'Aimbots move a cursor in ways people do not. The question was whether a model could learn what human movement looks like, and flag everything else as suspect.',
		approach: [
			'Built a high-performance Rust CLI suite (rdev and enigo) to capture mouse telemetry and to simulate procedural aimbot movement.',
			'Trained an LSTM autoencoder on movement sequences; anomalies surface as high reconstruction error.',
			'Designed a technical workshop on behavioural biometrics, using the system to teach cheat detection with deep learning.'
		],
		outcomes: [
			'Human movement reconstructs cleanly; aimbot paths land **past the error threshold**.',
			'The system became **a technical workshop** on behavioural biometrics.'
		],
		tools: ['Rust', 'Python', 'TensorFlow'],
		sketch: 'aimbot',
		image: null,
		href: repo('aimbot-hunter')
	}
];

export type Credential = {
	date: string;
	/** Set large beside the entry; defaults to `date`. Keep it short: a year or a span. */
	numeral?: string;
	kind: 'Education' | 'Award';
	title: string;
	org: string;
	/** **Double asterisks** mark the figure. */
	summary: string;
};

// Education and awards, oldest first. Each entry owns one stretch of the integral in the
// Education stage, so adding an entry adds a stretch; nothing else needs to change.
export const education: Credential[] = [
	{
		date: 'May 2024',
		numeral: '2024',
		kind: 'Education',
		title: 'Specialised Software Engineering, ICT',
		org: 'Asia Pacific University, Bukit Jalil',
		summary:
			'Began a degree specialising in AI and systems programming. **CGPA 3.6** of 4.0, with a **20% merit scholarship**.'
	},
	{
		date: '2024/25',
		numeral: '24/25',
		kind: 'Award',
		title: 'Champion, UM Integral Bee',
		org: 'Limit Doesn’t Exist, University of Malaya',
		summary: '**First place** in a university calculus competition.'
	},
	{
		date: '2025/26',
		numeral: '25/26',
		kind: 'Award',
		title: 'Champion, UM Integral Bee, again',
		org: 'Limit Doesn’t Exist, University of Malaya',
		summary: '**First place** for the second year running.'
	}
];

export type Stage = {
	/** Anchor for links from elsewhere on the page, e.g. `#experience-g2g`. */
	id: string;
	date: string;
	kind: 'Community' | 'Work' | 'Research';
	title: string;
	org: string;
	summary: string;
	/** Present tense: shown with a live marker on the timeline. */
	now?: boolean;
	/** Starts expanded. */
	open?: boolean;
	points?: string[];
	tools?: string[];
};

// Experience, oldest first, the way a river runs.
export const experience: Stage[] = [
	{
		id: 'experience-gdg',
		date: 'Dec 2025',
		kind: 'Community',
		title: 'AI Department Trainee',
		org: 'Google Developer Group on Campus, APU',
		summary: 'Supporting the AI department’s initiatives and technical direction.',
		now: true,
		points: [
			'Researching how to pair Rust with machine learning models, for community knowledge-sharing sessions.',
			'Helping the core team organise campus tech events and a collaborative developer culture.'
		],
		tools: ['Rust']
	},
	{
		id: 'experience-g2g',
		date: 'May 2026',
		kind: 'Work',
		title: 'Software Engineer Intern',
		org: 'G2G, Kuala Lumpur',
		summary: 'Computer vision and vision-language models for eKYC identity verification, from data to production.',
		now: true,
		open: true,
		points: [
			'Built the eKYC selfie action check end to end: a YOLO face-visibility model trained on production selfies and exported to ONNX-web, combined in the browser with MediaPipe head-pose and expression signals. Packaged as face-engine, a new npm package the web SDK uses for occlusion detection and a six-action liveness challenge.',
			'Owned the data and training lifecycle for the face-visibility and document detection models, with a Grounding DINO auto-labelling pipeline and human QA. The models reach **0.99 mAP@50** on the held-out test set.',
			'Retrained the document detector as a two-class model to add passports, fixing a production issue where passport auto-capture failed, and cut inference time by **30 to 48%**.',
			'Benchmarked more than 12 vision-language models across OpenAI, Google, Anthropic and xAI, then shipped a pruned-prompt, single-image configuration that cut cost per 1,000 checks by **70%** and latency by **45%** while holding accuracy.'
		],
		tools: ['Python', 'TypeScript', 'YOLO', 'ONNX', 'MediaPipe', 'Vision-language models']
	},
	{
		id: 'experience-ai-club',
		date: 'Jul 2026',
		kind: 'Research',
		title: 'Research and Development Team Member',
		org: 'APU Artificial Intelligence Club',
		summary: 'Part-time research and development in artificial intelligence.',
		now: true
	}
];

// Where the experience timeline ends: not a stage, an open question.
export const experienceEnd = { date: 'Next', title: 'Not yet written.', summary: 'The river keeps moving.' };

// Condensed skills. Selecting one shows the projects, and any role, that used it.
export const toolkit = [
	{ group: 'Languages', items: ['Python', 'Rust', 'TypeScript', 'SQL'] },
	{
		group: 'AI and ML',
		items: ['YOLO', 'Vision-language models', 'AI agents', 'Reinforcement learning', 'TensorFlow', 'Embeddings']
	},
	{ group: 'Data and MLOps', items: ['DVC', 'MLflow', 'DuckDB', 'Prefect', 'ONNX', 'MediaPipe'] },
	{ group: 'Product', items: ['FastAPI', 'SvelteKit', 'Svelte', 'PostgreSQL', 'Docker'] }
];

export const about = {
	paragraphs: [
		'I study software engineering at Asia Pacific University, specialising in AI and systems programming, and intern as a software engineer at G2G.',
		'Most of my work sits where machine learning meets low-level code: vision models that run in the browser, agents that are checked before they are trusted, and Rust that makes the maths fast.',
		'Away from code I compete in calculus, twice winning the UM Integral Bee.'
	],
	facts: [
		{ label: 'Studying', value: 'Software Engineering, APU. CGPA 3.6 of 4.0' },
		{ label: 'Working', value: 'Software engineer intern, computer vision at G2G' },
		{ label: 'Based in', value: 'Kuala Lumpur, Malaysia' }
	]
};

export const contact = {
	headline: 'Have a question worth thinking about?',
	socials: [{ label: 'GitHub', href: github }],
	// Shown in the footer with the visitor's own visit count.
	visit: (n: number) =>
		n <= 1
			? 'First visit. The river at the top of this page was drawn for you alone.'
			: `Visit ${n}. Not the same river, not the same visitor.`,
	credit: {
		label: 'The Thinker, 3D scan by Rigsters, CC BY 4.0',
		href: 'https://sketchfab.com/3d-models/the-thinker-by-auguste-rodin-08a1e693c9674a3292dec2298b09e0ae'
	}
};
