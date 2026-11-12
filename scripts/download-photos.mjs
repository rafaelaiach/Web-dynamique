// Downloads the property photos from Unsplash into src/assets/photos/
// and switches src/assets/photos.js to use these local files,
// so the photos are inside the project and work without internet.
//
// Run once from the project folder:   node scripts/download-photos.mjs

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const photosFile = path.join(root, 'src/assets/photos.js');
const photosDir = path.join(root, 'src/assets/photos');

// Matches entries like:  { uri: unsplash('1621983209348-7b5a63f23866'), credit: ... }
const ENTRY = /\{ uri: unsplash\('([0-9a-f-]+)'\), credit:/g;

export function useLocalFiles(source) {
  return source.replace(ENTRY, (_m, id) => `{ source: require('./photos/${id}.jpg'), credit:`);
}

async function main() {
  const source = await readFile(photosFile, 'utf8');
  const ids = [...new Set([...source.matchAll(ENTRY)].map((m) => m[1]))];
  if (ids.length === 0) {
    console.log('Nothing to do: photos.js already uses local files.');
    return;
  }

  await mkdir(photosDir, { recursive: true });
  console.log(`Downloading ${ids.length} photos into src/assets/photos/ ...`);
  for (const id of ids) {
    const file = path.join(photosDir, `${id}.jpg`);
    if (existsSync(file)) { console.log(`  ✓ ${id}.jpg (already there)`); continue; }
    const url = `https://images.unsplash.com/photo-${id}?w=1080&q=70&fit=crop&fm=jpg`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Could not download ${url} (HTTP ${res.status}). Nothing was changed in photos.js.`);
    const bytes = Buffer.from(await res.arrayBuffer());
    await writeFile(file, bytes);
    console.log(`  ✓ ${id}.jpg (${Math.round(bytes.length / 1024)} KB)`);
  }

  await writeFile(photosFile, useLocalFiles(source));
  console.log('\nDone. src/assets/photos.js now uses the local photos.');
  console.log('Next: git add . && git commit -m "Photos en local" && git push');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((e) => { console.error('\n✗ ' + e.message); process.exit(1); });
}
