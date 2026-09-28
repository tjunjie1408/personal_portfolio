<script lang="ts">
	import { onMount } from 'svelte';
	import DecryptedText from '../svelte-bits/DecryptedText.svelte';
	import Magnet from '../svelte-bits/Magnet.svelte';
	import { contact, site } from '$lib/content';
	import { reveal } from '$lib/motion/reveal';
	import { scrollToTarget } from '$lib/motion/scroll.svelte';

	let hovered = $state(-1);
	const words = contact.headline.split(' ');
	const year = new Date().getFullYear();

	// Counted per browser. Storage can be blocked, in which case the line simply stays hidden.
	let visits = $state(0);
	onMount(() => {
		try {
			visits = Number(localStorage.getItem('visits') ?? 0) + 1;
			localStorage.setItem('visits', String(visits));
		} catch {
			visits = 0;
		}
	});
</script>

<section id="contact" class="contact seam" data-field="gather" data-label="Contact">
	<div class="wrap">
		<h2 class="headline" data-reveal="lines" use:reveal={{ threshold: 0.4 }}>
			{#each words as word, i (i)}<span class="line-mask word"><span class="line" style:--i={i}>{word}</span></span
				>{' '}{/each}
		</h2>

		<div class="cta" data-reveal use:reveal={{ delay: 300 }} data-field-anchor>
			<Magnet padding={120} strength={4}>
				<a class="mail" href="mailto:{site.email}">
					<span class="mail-label">Write to me</span>
					<span class="mail-addr mono">{site.email}</span>
				</a>
			</Magnet>
		</div>
	</div>

	<footer class="footer wrap">
		<ul class="socials">
			{#each contact.socials as s, i (s.label)}
				<li>
					<a
						class="mono"
						href={s.href}
						target="_blank"
						rel="noreferrer"
						onmouseenter={() => (hovered = i)}
						onmouseleave={() => (hovered = -1)}
					>
						<DecryptedText text={s.label} trigger={hovered === i} characters="abcdefghijklmnopqrstuvwxyz" />
					</a>
				</li>
			{/each}
		</ul>
		<p class="label muted">&copy; {year} {site.name}</p>
		<button class="label top" onclick={() => scrollToTarget(0)}>Back to top</button>
		<p class="visit label">{visits ? contact.visit(visits) : ''}</p>
		<a class="credit label muted" href={contact.credit.href} target="_blank" rel="noreferrer">{contact.credit.label}</a>
	</footer>
</section>

<style>
	.contact {
		min-height: 100dvh;
		display: grid;
		grid-template-rows: 1fr auto;
		padding-top: clamp(7rem, 18vh, 12rem);
	}

	.headline {
		font-size: clamp(3rem, 7vw, 6rem);
		font-weight: 400;
		line-height: 1;
		letter-spacing: -0.04em;
		max-width: 12ch;
	}

	.word {
		display: inline-block;
		vertical-align: top;
	}

	.cta {
		margin-top: clamp(3rem, 8vh, 5rem);
	}

	.mail {
		position: relative;
		display: inline-grid;
		gap: 0.35rem;
		padding: 1.5rem 2rem;
		border: 1px solid var(--ink);
		overflow: hidden;
		isolation: isolate;
		transition: color 0.5s var(--ease-out);
	}

	/* Fill rises from below on hover: acknowledgement before the click. */
	.mail::before {
		content: '';
		position: absolute;
		inset: 0;
		z-index: -1;
		background: var(--accent);
		transform: translateY(101%);
		transition: transform 0.6s var(--ease-out);
	}

	.mail:hover,
	.mail:focus-visible {
		color: var(--accent-ink);
		border-color: var(--accent);
	}

	.mail:hover::before,
	.mail:focus-visible::before {
		transform: none;
	}

	.mail:active {
		transform: scale(0.98);
	}

	.mail-label {
		font-size: clamp(1.5rem, 2.6vw, 2.25rem);
		letter-spacing: -0.03em;
		line-height: 1.1;
	}

	.footer {
		display: grid;
		grid-template-columns: 1fr auto auto;
		align-items: center;
		gap: 2rem;
		padding-block: 3rem 2rem;
		margin-top: 6rem;
	}

	.socials {
		display: flex;
		gap: 1.75rem;
	}

	.socials a:hover {
		color: var(--accent);
	}

	.muted {
		color: var(--muted);
	}

	.top {
		justify-self: end;
	}

	.top:hover {
		color: var(--accent);
	}

	.visit {
		grid-column: 1 / 3;
		min-height: 1lh;
		color: var(--accent);
	}

	.credit {
		justify-self: end;
		font-size: 0.75rem;
	}

	.credit:hover {
		color: var(--ink);
	}

	@media (max-width: 767px) {
		.footer {
			grid-template-columns: 1fr;
			gap: 1.25rem;
		}

		.visit {
			grid-column: auto;
		}

		.credit,
		.top {
			justify-self: start;
		}
	}
</style>
