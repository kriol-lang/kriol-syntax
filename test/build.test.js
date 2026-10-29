import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildArtifacts, DIST_DIR } from '../src/build.js';
import { WORD_CATEGORIES, loadSpec } from '../src/spec.js';

const spec = loadSpec();

test('dist is up to date with the specification (run `npm run build`)', () => {
  for (const [file, content] of Object.entries(buildArtifacts(spec)))
    assert.equal(readFileSync(new URL(file, DIST_DIR), 'utf8'), content, `dist/${file} is stale`);
});

test('the module exports every word list of the specification', async () => {
  const kriol = await import('../dist/index.js');

  for (const category of WORD_CATEGORIES)
    assert.deepEqual(kriol[category], spec.words[category], category);
  assert.deepEqual(kriol.keywords, [...spec.words.declarationKeywords, ...spec.words.controlKeywords]);
  assert.deepEqual(kriol.fileExtensions, spec.fileExtensions);
  assert.deepEqual(kriol.comments, spec.comments);
});

test('the exported lists cannot be changed by a consumer', async () => {
  const kriol = await import('../dist/index.js');

  assert.ok(Object.isFrozen(kriol.controlKeywords));
  assert.ok(Object.isFrozen(kriol.comments.block));
});

test('the type declarations name every export', () => {
  const declarations = buildArtifacts(spec)['index.d.ts'];

  for (const name of [...WORD_CATEGORIES, 'keywords', 'fileExtensions', 'comments', 'scopeName'])
    assert.match(declarations, new RegExp(`export declare const ${name}:`), name);
});
