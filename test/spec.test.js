import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WORD_CATEGORIES, allWords, loadSpec, validateSpec } from '../src/spec.js';

function validSpec() {
  return {
    name: 'kriol',
    displayName: 'Kriol',
    scopeName: 'source.kriol',
    fileExtensions: ['kriol', 'kr'],
    comments: { line: '//', block: ['/*', '*/'] },
    words: Object.fromEntries(WORD_CATEGORIES.map((category, i) => [category, [`w${i}`]])),
  };
}

test('the specification is valid', () => {
  assert.deepEqual(validateSpec(loadSpec()), []);
});

test('a well-formed specification has no problems', () => {
  assert.deepEqual(validateSpec(validSpec()), []);
});

test('reports a missing word category', () => {
  const spec = validSpec();
  delete spec.words.booleans;

  assert.deepEqual(validateSpec(spec), ["words.booleans must be a non-empty list"]);
});

test('reports a word listed in two categories', () => {
  const spec = validSpec();
  spec.words.booleans = ['si'];
  spec.words.controlKeywords = ['si'];

  assert.deepEqual(validateSpec(spec), ["'si' is listed more than once"]);
});

test('reports a word that is not a plain identifier', () => {
  const spec = validSpec();
  spec.words.controlKeywords = ['si|sinon'];

  assert.deepEqual(validateSpec(spec), ["'si|sinon' is not an identifier"]);
});

test('reports missing file extensions', () => {
  const spec = validSpec();
  spec.fileExtensions = [];

  assert.deepEqual(validateSpec(spec), ['fileExtensions must be a non-empty list']);
});

test('the entry function inisiu is a plain name, not a reserved word', () => {
  assert.ok(!allWords(loadSpec()).includes('inisiu'));
});
