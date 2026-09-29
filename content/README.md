# 写作说明

这个文件夹就是 Obsidian vault，也是博客的全部内容。在 Obsidian 里选 **打开文件夹作为仓库**，指向 `content/`。

```
content/
  essays/     长文，路径 /blog/<slug>
  notes/      笔记，同样是 /blog/<slug>，列表里显示得更紧凑
  assets/     图片（Obsidian 粘贴图片会自动放到这里）
  templates/  新建文章用的模板（不会发布）
```

文件放在哪个文件夹，就决定了它是长文还是笔记。这个 README 和 `templates/` 都不会被发布。

## Front matter

```yaml
---
date: 2026-09-29          # 必填
description: 一句话摘要     # 长文发布前必填；笔记可以不写，会自动截取开头
tags: [ml, philosophy]     # 可选，会自动转成小写、用连字符连接
slug: my-post              # 可选，默认用文件名；中文标题建议写一个英文 slug
title: 标题                # 可选，默认用文件名（和 Obsidian 一样）
updated: 2026-10-02        # 可选，文末会显示"修订于"
draft: true                # 草稿只在 npm run dev 里出现，不会被构建发布
---
```

## 能用的写法

- `$行内公式$`、`$$块级公式$$`（KaTeX）
- 代码块：` ```ts title="file.ts" `（文件名）、` ```ts {2-4} `（高亮第 2–4 行）、` ```ts /word/ `（高亮某个词）
- 在代码行尾写注释：`// [!code highlight]`、`// [!code ++]`、`// [!code --]`、`// [!code focus]`
- `==高亮==`
- Callout：`> [!note] 标题`、`> [!warning]`、`> [!quote]` 等，和 Obsidian 的类型一致
- 图片：`![说明文字](../assets/图.png "图注")`，引号里的内容会变成图注
- 任务列表 `- [ ]`、表格、删除线

## 注意

- 正文里的 `{` `}` 会按原样显示。想在文章里放 Svelte 组件，比如 `<Demo n={5} />`，组件属性里的花括号照常生效。
- 图片必须放在 `assets/` 里。如果文件名写错，构建会直接报错，而不是悄悄漏掉这张图。
- `%%Obsidian 注释%%`（单行、跨行都可以）在构建时会被删掉，不会出现在网页上。但源文件本身会进 git，如果 repo 是公开的，别人仍然看得到。
- `[[双链]]` 已经在 vault 设置里关掉了（`.obsidian/app.json`），链接会写成标准 Markdown。
