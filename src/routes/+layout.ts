import { dev } from '$app/environment';
import { injectAnalytics } from '@vercel/analytics/sveltekit';
import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';

export const prerender = true;

// Page views and Core Web Vitals, reported to the Vercel dashboard. Both need to be enabled on the
// project (Analytics and Speed Insights tabs); in development they only log to the console.
injectAnalytics({ mode: dev ? 'development' : 'production' });
injectSpeedInsights();
