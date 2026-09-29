<script lang="ts">
	import Hero from '$lib/components/sections/Hero.svelte';
	import Premise from '$lib/components/sections/Premise.svelte';
	import Propositions from '$lib/components/sections/Propositions.svelte';
	import Work from '$lib/components/sections/Work.svelte';
	import Quote from '$lib/components/sections/Quote.svelte';
	import About from '$lib/components/sections/About.svelte';
	import Education from '$lib/components/sections/Education.svelte';
	import Experience from '$lib/components/sections/Experience.svelte';
	import Toolkit from '$lib/components/sections/Toolkit.svelte';
	import Contact from '$lib/components/sections/Contact.svelte';
	import CaseStudy from '$lib/components/CaseStudy.svelte';
	import { projects } from '$lib/content';
	import { caseStudy } from '$lib/case.svelte';
</script>

<Hero />
<Premise />
<Propositions />
<About />
<Education />
<Experience />
<Work />
<Quote />
<Toolkit />
<Contact />

<!-- One case-study panel for the page; Work and Toolkit both open it. -->
<CaseStudy {projects} index={caseStudy.index} onchange={(i) => (caseStudy.index = i)} />
