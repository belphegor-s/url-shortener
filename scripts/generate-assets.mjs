// Generates the SHRT brand mark: one theme-aware SVG for browsers that support it,
// plus the raster fallbacks GitHub, older browsers and mobile home screens need.
// Run with `npm run assets`. Requires `sharp` (devDependency).
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'admin', 'public');
const assetsDir = path.join(root, 'assets');

const INK = '#09090b';
const PAPER = '#fafafa';

/** The mark itself: a rounded square with the link glyph knocked out of it. */
const glyph = (fg) =>
	`<g fill="none" stroke="${fg}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">` +
	`<path d="M13.5 18.5a4 4 0 0 0 5.66 0l2.5-2.5a4 4 0 0 0-5.66-5.66l-1 1"/>` +
	`<path d="M18.5 13.5a4 4 0 0 0-5.66 0l-2.5 2.5a4 4 0 0 0 5.66 5.66l1-1"/>` +
	`</g>`;

/** Flat two-colour mark, for rasterising. No CSS, so every renderer agrees. */
const flat = (fg, bg) =>
	`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">` +
	`<rect width="32" height="32" rx="8" fill="${bg}"/>${glyph(fg)}</svg>`;

/** Theme-aware mark: ink on paper in light, inverted in dark, matching the site. */
const adaptive =
	`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">` +
	`<style>:root{--bg:${INK};--fg:${PAPER}}@media (prefers-color-scheme:dark){:root{--bg:${PAPER};--fg:${INK}}}</style>` +
	`<rect width="32" height="32" rx="8" fill="var(--bg)"/>${glyph('var(--fg)')}</svg>`;

await mkdir(publicDir, { recursive: true });
await mkdir(assetsDir, { recursive: true });

await writeFile(path.join(publicDir, 'favicon.svg'), adaptive);
console.log('wrote admin/public/favicon.svg');

// Rasterise the light-mode mark: a PNG cannot adapt, and ink-on-paper is the
// variant that reads correctly against both browser chromes.
const source = Buffer.from(flat(PAPER, INK));
const png = (size) => sharp(source, { density: 384 }).resize(size, size).png().toBuffer();

/** Opaque canvas with the mark centred on it, for iOS home screens. */
async function flattened(size, inner) {
	const mark = await png(inner);
	return sharp({ create: { width: size, height: size, channels: 4, background: INK } })
		.composite([{ input: mark, gravity: 'center' }])
		.png()
		.toBuffer();
}

// Served by the Worker through the ASSETS binding, so these names are load-bearing.
const served = [
	{ file: 'favicon-16.png', size: 16 },
	{ file: 'favicon-32.png', size: 32 },
	{ file: 'icon-192.png', size: 192 },
	{ file: 'icon-512.png', size: 512 },
	{ file: 'apple-touch-icon.png', size: 180, flat: 156 },
];

for (const target of served) {
	const buf = target.flat ? await flattened(target.size, target.flat) : await png(target.size);
	await sharp(buf).toFile(path.join(publicDir, target.file));
	console.log(`wrote admin/public/${target.file} (${target.size}x${target.size})`);
}

// Extra sizes for listings and store entries; not served by the Worker.
for (const target of [
	{ file: 'github-app-logo-400.png', size: 400 },
	{ file: 'app-icon-1024.png', size: 1024 },
]) {
	await sharp(await png(target.size)).toFile(path.join(assetsDir, target.file));
	console.log(`wrote assets/${target.file} (${target.size}x${target.size})`);
}
