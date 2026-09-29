`src/lib/content.ts` 里的文字是之前从简历、LinkedIn 和项目 README 摘的临时内容，记得换成你的最终版本

## 博客的已知限制（2026-09-29）

- **mdsvex 0.12 用的是老版本 remark**（内部打包的是 remark 8）。以后想加 remark 插件，得挑老版本兼容的，比如 `remark-math` 就锁在 3.x。rehype 插件一般没问题。等 mdsvex 1.0 正式版出来再考虑迁移，文章本身不用改。
- **`==高亮==` 不能跨格式**：`==**粗体**==` 这种高亮里面套粗体的写法不会生效，只有在同一段纯文本里的高亮才会被识别。代码在 `src/lib/blog/rehype.ts` 的 `rehypeMark`。
- **图片只生成 1x 和 2x 两档**：不会按屏幕宽度生成更多尺寸。个人博客够用，以后图片多了、页面变慢了，再在 `src/lib/components/blog/Img.svelte` 里加宽度参数。
- **控制台里有一条 `history.pushState` 警告**：SvelteKit 提示不要直接调用 `history.pushState`。项目的 `src/` 里没有这个调用，应该不是博客这次改出来的，可能来自某个依赖，还没继续追。
