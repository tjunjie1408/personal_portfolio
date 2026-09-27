# The Thinker model

The hero loads `static/models/thinker.glb`. Until that file exists the hero shows only the river.

1. Log in to Sketchfab and download **The Thinker by Auguste Rodin** by Rigsters
   (CC BY 4.0): https://sketchfab.com/3d-models/the-thinker-by-auguste-rodin-08a1e693c9674a3292dec2298b09e0ae
   Choose the **glTF Binary (.glb)** format.
2. Shrink it. The script drops the colour textures (the site paints its own marble), keeps the
   normal map at 2048px WebP, and meshopt-compresses the geometry (85 MB became 1.1 MB):

   ```bash
   node scripts/prepare-model.mjs path/to/download.glb
   ```

3. Reload the page. If the figure faces the wrong way, change `FACING` in
   `src/lib/components/Statue.svelte` (radians, for example `Math.PI / 2`).

CC BY requires credit. The footer already links to the author; keep it if you use this scan.
