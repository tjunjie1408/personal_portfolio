# Writing guide

This folder is the Obsidian vault and holds all of the blog's content. In Obsidian, choose **Open folder as vault** and point it at `content/`.

```
content/
  essays/     long pieces, at /blog/<slug>
  notes/      notes, also at /blog/<slug>, shown more compactly in the list
  assets/     images (Obsidian puts pasted images here automatically)
  guides/     reference guides for writing (not published)
  templates/  templates for new posts (not published)
```

The folder a file sits in decides whether it's an essay or a note. This README, `guides/` and `templates/` are never published.

## Front matter

```yaml
---
date: 2026-09-29          # required
description: One-line summary  # required for essays before they publish; notes can skip it and get the opening of the text
tags: [ml, philosophy]     # optional, lowercased and joined with hyphens automatically
slug: my-post              # optional, defaults to the file name; for a Chinese title, set an English slug
title: Title               # optional, defaults to the file name (as in Obsidian)
updated: 2026-10-02        # optional, shows "Revised" at the end of the post
draft: true                # drafts appear only in npm run dev and are never built or published
---
```

`draft` must be `true` or `false`. Writing `yes`, `"true"` or anything else is an error, so a draft can't be mistaken for a published post.

## Drafts never reach production

During `npm run build`, drafts and images used only by drafts are not bundled at all: they're absent from the client JS, the server code and the image files, and their file names don't appear either. The build checks this at the end and fails if a draft slipped in. The implementation is in `src/lib/blog/vite.ts`.

## Preview while writing

1. Run `npm run dev` in the project root
2. In Obsidian desktop: Settings, Core plugins, turn on **Web viewer**
3. Open `http://localhost:5173/blog/preview` in the Web viewer and drag it beside the editor

The preview page lists every post (drafts included) and shows how each looks in the list, as a share card and in RSS, plus what to fix before publishing: an essay without a description, a summary that's too long, a missing image, a broken formula. After you save in Obsidian, the preview and post pages update on their own, no refresh needed. Each post has an "Open in Obsidian" link.

This page exists only under `npm run dev`; the build doesn't generate it.

## What you can write

- `$inline math$` and `$$display math$$` (KaTeX). Inline formulas in summaries are detected and rendered too, and a summary is never cut in the middle of one. Amounts like `$5 and $10` aren't treated as math (the same rule as Obsidian: a `$` opens only before a non-space, and a closing `$` can't be followed by a digit)
- Code blocks: ` ```ts title="file.ts" ` (file name), ` ```ts {2-4} ` (highlight lines 2 to 4), ` ```ts /word/ ` (highlight a word)
- Comments at the end of a code line: `// [!code highlight]`, `// [!code ++]`, `// [!code --]`, `// [!code focus]`
- `==highlight==`
- Callouts: `> [!note] Title`, `> [!warning]`, `> [!quote]` and so on, with the same types as Obsidian
- Images: `![alt text](../assets/image.png "Caption")`; the quoted text becomes the caption
- Task lists `- [ ]`, tables, strikethrough

## Diagrams (draw.io)

- Save diagrams as `.drawio.svg` in `assets/` and reference them like images: `![description](../assets/x.drawio.svg "Caption")`. The one file is both the image and the draw.io source, so you can open it again in draw.io to edit it (draw.io desktop, or the Draw.io Integration extension for VS Code)
- A `.drawio.svg` is shown at its own size, not stretched to the column; it inverts automatically in dark mode; on phones, a diagram that's too wide scrolls sideways
- Draw for the light theme: light background, dark lines, and one accent colour only (the site red `#C8201A`)
- Starting point: `assets/transformer-encoder.drawio.svg`, with the site palette, right-angled lines (Orthogonal), gaps at crossings (Line jumps: gap), a 10px grid and a legend. Copying it is the fastest way to start
- Prefer tall diagrams no wider than 720px; they read better on phones
- `guides/architecture-diagrams.md` covers how to draw model architecture diagrams in depth

## Notes

- `{` and `}` in the text are shown as they are. To put a Svelte component in a post, such as `<Demo n={5} />`, braces in component attributes work as usual.
- Images must live in `assets/`. A mistyped file name fails the build instead of quietly dropping the image.
- `%%Obsidian comments%%` (single-line or multi-line) are removed at build time and never appear on the page. The source files still go into git, though, so anyone can read them if the repo is public.
- `[[Wikilinks]]` are turned off in the vault settings (`.obsidian/app.json`), so links are written as standard Markdown.
