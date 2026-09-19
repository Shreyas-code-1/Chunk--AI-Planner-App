#!/usr/bin/env node
/**
 * Extract design/board.html into readable form.
 *
 * The Claude Design "standalone" export is self-contained but not readable:
 * the board markup sits as a single JSON-encoded string inside a
 * <script type="__bundler/template"> block, and every image and font lives in
 * a <script type="__bundler/manifest"> block as base64 keyed by UUID.
 *
 * This script is READ-ONLY with respect to board.html. It writes:
 *   design/extracted/board.html   the unescaped markup
 *   design/extracted/<uuid>.<ext> every inlined image and font
 *   design/extracted/index.json   uuid -> {mime, file, bytes}
 *
 * Re-runnable: delete the outputs and run `node scripts/extract-board.mjs`.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const board = join(root, 'design', 'board.html');
const outDir = join(root, 'design', 'extracted');

const EXT = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/svg+xml': 'svg',
  'font/woff2': 'woff2',
  'font/woff': 'woff',
  'text/html': 'html',
  'text/javascript': 'js',
};

/** Pull the JSON payload that follows a <script type="__bundler/NAME"> tag. */
function payload(lines, name) {
  const i = lines.findIndex((l) => l.includes(`<script type="__bundler/${name}">`));
  if (i === -1) throw new Error(`no __bundler/${name} block in board.html`);
  // The payload is the next non-empty line; it is valid JSON on its own.
  for (let j = i + 1; j < lines.length; j++) {
    const line = lines[j].trim();
    if (line) return JSON.parse(line);
  }
  throw new Error(`__bundler/${name} block is empty`);
}

const lines = readFileSync(board, 'utf8').split('\n');

// --- assets -----------------------------------------------------------------
mkdirSync(outDir, { recursive: true });
const manifest = payload(lines, 'manifest');
const index = {};
for (const [uuid, asset] of Object.entries(manifest)) {
  if (asset.compressed) {
    console.warn(`skipping ${uuid}: compressed assets are not handled`);
    continue;
  }
  const ext = EXT[asset.mime] ?? 'bin';
  const buf = Buffer.from(asset.data, 'base64');
  const file = `${uuid}.${ext}`;
  writeFileSync(join(outDir, file), buf);
  index[uuid] = { mime: asset.mime, file, bytes: buf.length };
}
writeFileSync(join(outDir, 'index.json'), JSON.stringify(index, null, 2));

// --- markup -----------------------------------------------------------------
// The template is a JSON string, so JSON.parse does the unescaping (including
// the \u002F that the exporter uses for every closing slash).
const markup = payload(lines, 'template');
writeFileSync(join(outDir, 'board.html'), markup);

const counts = Object.values(index).reduce((acc, a) => {
  acc[a.mime] = (acc[a.mime] ?? 0) + 1;
  return acc;
}, {});
console.log(`markup: ${markup.length.toLocaleString()} chars`);
console.log(`assets: ${Object.keys(index).length}`, counts);
