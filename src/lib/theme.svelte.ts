export type Theme = 'light' | 'dark';

export const theme = $state<{ current: Theme }>({ current: 'light' });

/** Reads the theme app.html resolved before paint. */
export function syncTheme() {
	theme.current = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

export function toggleTheme() {
	theme.current = theme.current === 'dark' ? 'light' : 'dark';
	document.documentElement.dataset.theme = theme.current;
	try {
		localStorage.setItem('theme', theme.current);
	} catch {
		// storage unavailable (private mode, blocked site data): the toggle still works for this visit
	}
}
