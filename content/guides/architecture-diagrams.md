# Model architecture diagrams: a textbook

For drawing model diagrams for this blog. The goal is a diagram that can be understood at a glance, not a pretty one; pretty comes as a side effect of alignment, restraint and consistency.

Starting point: `content/assets/transformer-encoder.drawio.svg`. It uses every rule in this book, and copying it is the fastest way to start.

---

## Contents

1. Three questions an architecture diagram answers
2. Visual vocabulary: how to draw each thing
3. Layout: direction, spine and grid
4. Lines: right angles and crossings
5. Labels: shapes, hyperparameters and text
6. Colour
7. Level of detail: overview and close-up
8. Four classic figures, taken apart
9. From sketch to published
10. Pre-publish checklist
11. Common mistakes and fixes
12. Publishing on this blog

---

## 1. Three questions an architecture diagram answers

A reader looking at a model diagram is asking three things. Every mark on the page should answer one of them; delete the ones that don't.

| Question | What answers it on the page |
|---|---|
| **How does the data flow?** Where it enters, what it passes through, where it leaves | Arrows in one consistent direction, a clear spine |
| **How do the shapes change?** What the tensor looks like after each step | Shape labels beside the lines, such as `(B, T, d)` |
| **What repeats?** Which parts are stacked | A dashed box with `×N`, or one copy drawn with the count noted |

Diagrams are hard because all three have to hold at once. The usual failure is answering only the first: the arrows look good, but the reader can't tell where a dimension changed or which block is stacked twelve times.

---

## 2. Visual vocabulary: how to draw each thing

Use only these elements, and **always draw the same thing the same way**. Once the reader learns an element, they can read the whole diagram.

| Thing | How to draw it | Example in the template |
|---|---|---|
| Operation (has parameters or computes something) | Rounded rectangle, light grey fill, dark border | Embedding, Feed Forward |
| The layer this post is about | Same rectangle with an accent border and a light accent fill | Multi-Head Attention |
| Input / output | Plain text with no box, at the two ends of the spine | Input tokens, Output |
| Tensor shape | Small monospace text beside a line, never on top of it | `(B, T, d)` |
| Repeated structure | A dashed box around it, `×N` in the top-right corner | The encoder layer |
| Element-wise addition | A small circle with `+` (⊕) | Adding the positional encoding |
| Concatenation | A small circle with `C` or `‖`, explained in the legend | (not in the template; add it when needed) |
| Fork | A small solid dot; every branch leaves from this one point | The black dots where residuals split off |
| Data flow | Solid line with a solid arrowhead | The spine |
| Skip / residual connection | A lighter solid line that runs outside the spine | The two residual lines |
| Optional or training-only | Dashed line | (dropout, an auxiliary loss) |

**Why forks need a dot:** without one, a residual line looks as if it grows out of the side of a layer, and the reader assumes that layer has two outputs. A small black dot says it plainly: the same data was copied.

**Why shapes are in monospace:** `(B, T, d)` in monospace reads as "something from the code", not as explanatory text, and it matches inline code in the post.

---

## 3. Layout: direction, spine and grid

### 3.1 One direction per diagram

Pick a direction and keep it for the whole diagram:

- **Bottom to top**: the Transformer paper's convention. Suits models that stack layers, getting more abstract as they go up.
- **Left to right**: suits pipeline-shaped models (encoder, bottleneck, decoder, or several processing stages).

Any arrow that runs against the main direction makes the reader stop and ask whether it's feedback. Only real feedback or loops (RNN time steps, iterative refinement) may run backwards.

**This blog prefers tall, bottom-to-top diagrams**: phone screens are portrait, so a tall diagram doesn't have to shrink much on a phone.

### 3.2 Spine first, then branches

1. Find the longest path from input to output. That is the **spine**.
2. Put everything on the spine in one straight line (the same x), centred.
3. Hang branches, skip connections and extra inputs off the sides of the spine.

A straight spine gives the reader's eye a track to follow. Branches that enter and leave from the side read as "extra" at once.

### 3.3 Grid and spacing

- Turn on a **10px grid**. Every position and size is a multiple of 10.
- **Elements of the same kind are the same size**: all operation boxes share a width. Different widths suggest "this layer matters more", which you didn't mean.
- **Two or three spacings only**: one between layers, a larger one between groups. The template uses 40px between layers and 80px between blocks.
- Centre all text in its box, with equal padding above and below.

Most of what makes a diagram look tidy comes from this section, and it has little to do with taste.

---

## 4. Lines: right angles and crossings

### 4.1 Use right-angled lines

In draw.io: select the line, then in the Style panel set Edge to **Orthogonal** and turn **Rounded** off.

Right-angled lines only go across or down, so the reader never has to guess where a slanted line came from. Curves suit "roughly related"; they don't suit "data flows from here to there".

### 4.2 Avoiding crossings, in this order

1. **Reorder the nodes.** Most crossings come from nodes in the wrong order. Put connected nodes close together, so each layer's input comes from directly below it (or directly to its left).
2. **Run skip connections outside.** Route every residual or skip connection around the same side of the spine, without overlapping each other. In the template both residuals run on the left, over separate height ranges.
3. **Fork early.** When one piece of data goes to three places, fork it at one point and route from there; don't pull three separate lines from three different places.
4. **Split into two diagrams.** If lines still cross, the diagram is trying to say too much. Split it into an overview and a close-up (section 7).
5. **Line jumps, last.** If a crossing really can't be avoided, turn on **Line jumps** (Style, Line jumps, Gap or Arc). One line breaks or hops at the crossing, so the reader can see the two aren't connected.

### 4.3 Arrowheads

- Put an arrowhead only where data arrives. The segment leading into a fork has none, because the data hasn't reached anything yet.
- One arrowhead style per diagram: one solid triangle, one size.

---

## 5. Labels: shapes, hyperparameters and text

### 5.1 Shapes go beside the lines

- Label a shape where it **changes**, not on every line: one at the input, one after each change of dimensions, one at the output.
- Explain the symbols once, in the legend or the caption: `B` batch size, `T` sequence length, `d` model width, `H×W` spatial size, `C` channels.
- Write symbols, not numbers (`d`, not `512`), unless the post is about one specific configuration. Put concrete numbers in the caption or in a table in the text.

### 5.2 Hyperparameters

A layer name may carry its key hyperparameters, kept short: `Conv 3×3, 64`, `MHA, h=8`. Anything longer than one line goes in the caption.

### 5.3 Text

- At most two typefaces: sans-serif for layer names (Helvetica / Arial), monospace for shapes (Courier New).
- At most three sizes: 13 for layer names, 12 for secondary notes, 11 for shape labels.
- No italics and no bold for emphasis. To emphasise something, use colour (section 6).
- Layer names are nouns: `Feed Forward`, not `apply FFN to x`.

---

## 6. Colour

**Default: greyscale plus one accent.**

- Every layer gets the same light grey fill and dark border.
- The part this post is about (a new module, a replaced layer, the bottleneck under discussion) gets the accent (the site red `#C8201A`, light fill `#F6DCDA`).
- One emphasis per diagram. Emphasise two things and you've emphasised neither.

**Exception: colour by operation type.** When a few fixed operations recur throughout (convolution, pooling, upsampling, concatenation), give each operation a colour, and **always** include a legend. The U-Net figure does this: arrow colour means operation type. The rule is that a colour stands for "which operation", is never changed on a whim, and has exactly one meaning.

**Don't:**

- Gradients, shadows, 3D effects. They carry no information and look strange once dark mode inverts them.
- Colour used for "groups that look nice". Every colour must mean something you can say out loud in the legend.
- Colour as the only difference. Colour-blind readers can't tell red from green, so the accented box also changes its border and fill, and the residual lines differ in position as well as colour.

---

## 7. Level of detail: overview and close-up

A diagram stays at **one level of abstraction**. The larger the model, the more it needs splitting:

- **Overview**: one box per major module, showing only the connections between modules and the shapes. For example "split the image into patches, linear projection, Transformer encoder ×L, classification head".
- **Close-up**: one of those boxes opened up to show its insides. For example the Norm, Attention, MLP and residuals inside an encoder block.

Tie the two together with the same name and colour: the "Transformer Encoder" box in the overview has the same name and colour as the close-up's title. The ViT paper does exactly this: overview on the left, the encoder block enlarged on the right.

When to split: if you find yourself drawing many small boxes inside a big box and lines start to cross, it's time.

---

## 8. Four classic figures, taken apart

The four paper figures below are worth looking up in the original (study how they handle things; don't copy them). Each one ends with an exercise: redraw it with the template. After two or three, the layout habits stick, and that's much easier than designing from scratch.

### 8.1 Transformer (Vaswani et al., 2017, *Attention Is All You Need*, Figure 1)

- **Direction**: bottom to top. Inputs at the bottom, output probabilities at the top.
- **Repetition**: the encoder and the decoder are each wrapped in a large box marked `N×`.
- **Residuals**: every sub-layer (attention, feed-forward) has a line that goes from the sub-layer's input around to Add & Norm, along the side of the box.
- **What to learn**: the same "Add & Norm" box appears again and again, so the reader only has to understand it once. The positional encoding joins the spine through a ⊕ instead of being drawn as a complicated module.
- **Mind the variant**: the original puts Norm after the residual addition (post-LN). Many implementations now put Norm before attention (pre-LN). Draw the one that matches the implementation you're writing about. The template shows the original post-LN.
- **Exercise**: use the template to draw the decoder block, which adds a Masked Multi-Head Attention and an attention layer that takes the encoder's output. The encoder output enters from the side; it must not cross the decoder's spine.

### 8.2 ResNet residual block (He et al., 2016, *Deep Residual Learning for Image Recognition*, Figure 2)

- **Scope**: one block only, not the whole network. The cleanest example of a close-up.
- **Labels**: the main path is labelled `F(x)`, the shortcut `identity` (or `x`), and the sum `F(x) + x`. The idea the figure exists to explain is written on it as a formula.
- **What to learn**: one diagram, one idea. ResNet has dozens of layers, but the paper explains why it trains with a single block.
- **Exercise**: draw a bottleneck block (1×1 down, 3×3, 1×1 up), label each layer's channel count, and route the shortcut outside.

### 8.3 U-Net (Ronneberger et al., 2015, *U-Net: Convolutional Networks for Biomedical Image Segmentation*, Figure 1)

- **Layout**: a U. Down the left side is the encoder (resolution shrinks, channels grow), up the right side is the decoder, and each level lines up left to right.
- **Skip connections**: the two sides of each level are joined by a horizontal line, so it's obvious at a glance that the level's features are copied across.
- **Labels**: each feature-map box has its channel count on top and its spatial size beside it. Shape changes are the star of this figure.
- **Colour**: arrows are coloured by operation type, with a legend (the exception in section 6).
- **What to learn**: let the layout itself express the structure. The U isn't decoration; it maps resolution onto the vertical axis.
- **Exercise**: draw a three-level U-Net where height stands for resolution. Every skip connection must be a horizontal line, with no crossings.

### 8.4 Vision Transformer (Dosovitskiy et al., 2021, *An Image is Worth 16x16 Words*, Figure 1)

- **Structure**: the overall flow on the left (split into patches, linear projection, add position embeddings, Transformer encoder, MLP head), and a close-up of the encoder block on the right, marked `L×`.
- **Draw the input**: it actually shows an image cut into patches and the patches laid out in a row. The input is what's new in this paper, so the figure spends its attention there.
- **Special tokens**: the extra learnable `[class]` token has its own marker and is explained in the caption.
- **What to learn**: overview and close-up side by side in one figure, joined by the same name and colour (section 7).
- **Exercise**: redraw ViT with the template: the overall flow running vertically on the left, the template's encoder block on the right, and both the overview's encoder box and the close-up marked in the accent colour.

---

## 9. From sketch to published

1. **Sketch on paper or a whiteboard first.** Boxes and arrows only, no styling. Check that data flow, shape changes and repetition are all on it.
2. **Write out the shape table**: the tensor shape after every step. If you can't write it, you haven't thought the model through yet, and no amount of drawing will help.
3. **Lay out the spine in draw.io.** Copy the template, place only the spine's layers, in one straight line on the grid.
4. **Add branches and skip connections.** Handle crossings in the order from section 4.
5. **Add labels and the legend**: shapes, `×N`, the accent.
6. **Check it small.** Zoom to 50%. Can you still see the spine and the point of the diagram? Can you still read the text?
7. **Export and look at it on the site**, in light mode, dark mode and on a phone (section 12).

---

## 10. Pre-publish checklist

Answer each with yes or no. Publish only when every answer is yes.

- [ ] The diagram has one main direction, with no pointless backwards arrows
- [ ] Everything on the spine is in one straight line
- [ ] The same thing is drawn the same way everywhere (check against section 2)
- [ ] Elements of the same kind are the same size, with only two or three spacings
- [ ] Shapes are labelled wherever they change, and the symbols are explained in the caption
- [ ] Repeated structure is marked `×N`
- [ ] At most one accent; if colour means operation type, there's a legend
- [ ] No crossings; where one is unavoidable, it has a line jump
- [ ] The diagram matches the implementation being discussed (pre-LN or post-LN, for example)
- [ ] The caption says what the reader should notice
- [ ] Checked in dark mode and on a phone

---

## 11. Common mistakes and fixes

| Mistake | Why it's bad | Fix |
|---|---|---|
| Every layer a different colour | The colours mean nothing, and readers hunt for a pattern that isn't there | Back to greyscale plus one accent |
| Arrows in mixed directions | The reader has to piece the data flow together | Pick one direction and reorder the nodes |
| Box size follows text length | Implies differences in importance that don't exist | One width per kind of element; wrap or abbreviate long text |
| No shape labels | The reader can't tell where dimensions change | Label `(B, T, d)` and the like at every change |
| All 12 layers drawn out | Long, and it hides that they're identical | Draw one, mark it `×N` |
| Overview and detail in one diagram | Lines are bound to cross; levels get mixed | Split into an overview and a close-up |
| A residual line crosses other layers | Looks as if it connects to them | Route residuals outside the spine, from a fork dot |
| Decorative icons (brains, gears, lightning) | Take space, carry nothing | Delete them |
| Long sentences inside the diagram | The diagram turns into hard-to-read prose | Move sentences to the caption or the text |

---

## 12. Publishing on this blog

- **File**: save as `.drawio.svg` in `content/assets/`. One file is both the image and the source; open it again in draw.io desktop or the Draw.io Integration extension for VS Code to edit it.
- **Reference**: `![what the diagram shows](../assets/x.drawio.svg "Caption: what the reader should notice")`.
- **Size**: no wider than 720px. A `.drawio.svg` is shown at its own size, not stretched to the column.
- **Dark mode**: draw for the light theme (light background, dark lines). The site inverts it automatically in dark mode, and the accent stays red. That's another reason to avoid gradients and shadows: they look odd once inverted.
- **Phones**: a diagram too wide for the screen keeps its size and scrolls sideways. Tall diagrams work best.
- **Export settings**: transparent background, border 10. Use Helvetica / Arial and Courier New, because an SVG shown as an image can't use the site's Geist font.
- **Check**: before publishing, open the post under `npm run dev`, switch to dark mode once, then look at it at phone width. `/blog/preview` flags image file names that don't exist.
