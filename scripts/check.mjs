import assert from 'node:assert/strict';
import {access, readFile, readdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {CATEGORIES, OTHER_IMAGES, ROUND_TYPES, makeRound, replaceTile} from '../src/js/engine.js';

const root = fileURLToPath(new URL('../', import.meta.url));
for (const folder of ['src/js', 'scripts']) {
  for (const entry of await readdir(resolve(root, folder))) {
    if (!/\.(mjs|js)$/.test(entry)) continue;
    const result = spawnSync(process.execPath, ['--check', resolve(root, folder, entry)], {encoding: 'utf8'});
    assert.equal(result.status, 0, result.stderr);
  }
}

const images = new Set([...Object.values(CATEGORIES).flat(), ...OTHER_IMAGES]);
const scenes = new Set(ROUND_TYPES.flatMap(type => type.scenes || []));
assert.equal(images.size, 120, 'All 120 tile photos should be bundled');
assert.equal(scenes.size, 19, 'All 19 single-photo challenges should be bundled');
for (const image of [...images, ...scenes]) await access(resolve(root, 'public/assets', image));

for (const filename of ['index.html', 'image-credits.html']) {
  const html = await readFile(resolve(root, 'src', filename), 'utf8');
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const path = match[1];
    if (/^(?:https?:|#|data:)/.test(path) || path === './') continue;
    const found = await Promise.any(['src', 'public'].map(folder => access(resolve(root, folder, path))));
    void found;
  }
}
const cssFile = resolve(root, 'src/styles/main.css');
const css = await readFile(cssFile, 'utf8');
for (const match of css.matchAll(/url\(['"]?([^'"\)]+)['"]?\)/g)) {
  const path = match[1];
  if (/^(?:https?:|data:)/.test(path)) continue;
  const deployedPath = resolve(root, 'public/styles', path);
  await access(deployedPath);
}

for (let number = 0; number < ROUND_TYPES.length; number++) {
  const round = makeRound(number);
  assert.equal(round.tiles.length, round.split ? 16 : 9);
  if (!round.dynamic) continue;
  for (let click = 0; click < 100; click++) {
    const index = click % 9;
    const previous = round.tiles[index].image;
    replaceTile(round, index);
    assert.notEqual(round.tiles[index].image, previous);
    assert(round.tiles.some(tile => round.targets.includes(tile.image)), 'The endless round must keep a target');
  }
}

console.log('Passed: script syntax, 139 photos, HTML/CSS asset links, and endless replacement behavior.');
