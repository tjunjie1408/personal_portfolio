// Turns a downloaded Thinker scan into the lightweight file the hero loads.
//
//   node scripts/prepare-model.mjs <downloaded.glb> [static/models/thinker.glb]
//
// The site paints the figure in its own marble, so colour and metal/roughness textures are
// dropped. The normal map is kept (resized to 2048 and stored as WebP): it carries the sculpted
// detail a 51k-triangle scan cannot hold in geometry. Geometry is meshopt-compressed.

import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, meshopt, prune, textureCompress } from '@gltf-transform/functions';
import { MeshoptEncoder } from 'meshoptimizer';
import sharp from 'sharp';
import { statSync } from 'node:fs';

const [input, output = 'static/models/thinker.glb'] = process.argv.slice(2);
if (!input) {
	console.error('Usage: node scripts/prepare-model.mjs <downloaded.glb> [output.glb]');
	process.exit(1);
}

await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
const doc = await io.read(input);

for (const texture of doc.getRoot().listTextures()) {
	const size = texture.getSize();
	console.log(`texture ${texture.getName() || '(unnamed)'} ${texture.getMimeType()} ${size?.join('x')}`);
}

for (const material of doc.getRoot().listMaterials()) {
	material.setBaseColorTexture(null);
	material.setMetallicRoughnessTexture(null);
	material.setOcclusionTexture(null);
	material.setEmissiveTexture(null);
}

await doc.transform(
	prune(),
	dedup(),
	textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [2048, 2048], quality: 88 }),
	meshopt({ encoder: MeshoptEncoder, level: 'medium' })
);

await io.write(output, doc);
const mb = (bytes) => (bytes / 1024 / 1024).toFixed(2) + ' MB';
console.log(`${input} (${mb(statSync(input).size)}) -> ${output} (${mb(statSync(output).size)})`);
