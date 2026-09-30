The text in `src/lib/content.ts` is placeholder copy taken from the CV, LinkedIn and project READMEs. Remember to replace it with the final version.

## Known blog limitations (2026-09-29)

- **mdsvex 0.12 uses an old remark** (it bundles remark 8 internally). Any future remark plugin has to be an old-generation one, which is why `remark-math` is pinned at 3.x. Rehype plugins are generally fine. Consider migrating once mdsvex 1.0 is released; the posts themselves won't need changes.
- **`==highlight==` doesn't span formatting**: a highlight wrapping bold, such as `==**bold**==`, doesn't work. Only highlights within a single run of plain text are recognised. The code is `rehypeMark` in `src/lib/blog/rehype.ts`.
- **Images only get 1x and 2x sizes**: no extra sizes per screen width. That's enough for a personal blog; if there are more images later and pages get slow, add width parameters in `src/lib/components/blog/Img.svelte`.
- **A `history.pushState` warning in the console**: SvelteKit warns against calling `history.pushState` directly. Nothing in `src/` calls it, so it's probably not from the blog change and may come from a dependency. Not traced further yet.
