// Rasterizes the SHRT brand mark into the PNG sizes used by GitHub, browsers and
// mobile home screens. Run with `npm run assets`. Requires `sharp` (devDependency).
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'admin', 'public', 'favicon.svg');
const outDir = path.join(root, 'assets');
const BG = '#060608';

await mkdir(outDir, { recursive: true });

/** Opaque canvas with the rounded mark composited on top (for iOS home screens). */
async function flattened(size, inner) {
	const mark = await sharp(src, { density: 384 }).resize(inner, inner).png().toBuffer();
	return sharp({ create: { width: size, height: size, channels: 4, background: BG } })
		.composite([{ input: mark, gravity: 'center' }])
		.png()
		.toBuffer();
}

const targets = [
	{ file: 'github-app-logo-400.png', size: 400, kind: 'plain' },
	{ file: 'app-icon-1024.png', size: 1024, kind: 'plain' },
	{ file: 'app-icon-512.png', size: 512, kind: 'plain' },
	{ file: 'app-icon-192.png', size: 192, kind: 'plain' },
	{ file: 'favicon-32.png', size: 32, kind: 'plain' },
	{ file: 'favicon-16.png', size: 16, kind: 'plain' },
	{ file: 'apple-touch-icon-180.png', size: 180, kind: 'flat', inner: 156 },
];

for (const t of targets) {
	const buf = t.kind === 'flat' ? await flattened(t.size, t.inner) : await sharp(src, { density: 384 }).resize(t.size, t.size).png().toBuffer();
	await sharp(buf).toFile(path.join(outDir, t.file));
	console.log(`wrote assets/${t.file} (${t.size}x${t.size})`);
}
