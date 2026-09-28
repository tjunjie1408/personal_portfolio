<script lang="ts">
	import ScrollReveal from '../svelte-bits/ScrollReveal.svelte';
	import { premise } from '$lib/content';
</script>

<section class="premise wrap" aria-label="Premise" data-field="sediment" data-label="Premise">
	<div class="text">
		<ScrollReveal text={premise} />
	</div>
</section>

<style>
	.premise {
		display: grid;
		grid-template-columns: repeat(12, minmax(0, 1fr));
		gap: 2rem;
		padding-block: clamp(6rem, 15vh, 9rem);
	}

	.text {
		grid-column: 4 / -1;
		font-size: clamp(1.75rem, 3.9vw, 3.5rem);
		line-height: 1.18;
		letter-spacing: -0.035em;
		max-width: 24ch;
	}

	@media (max-width: 767px) {
		.premise {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}

		.text {
			grid-column: 1 / -1;
		}
	}
</style>
