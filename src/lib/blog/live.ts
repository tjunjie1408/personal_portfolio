import { onMount } from 'svelte';
import { invalidateAll } from '$app/navigation';

/** Dev only: reload page data when content/ is saved (event sent by src/lib/blog/vite.ts). */
export function liveContent() {
	onMount(() => {
		const hot = import.meta.hot;
		if (!hot) return;
		const reload = () => invalidateAll();
		hot.on('blog:content', reload);
		return () => hot.off('blog:content', reload);
	});
}
