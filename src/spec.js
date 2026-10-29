import { readFileSync } from 'node:fs';

export const SPEC_URL = new URL('../kriol-syntax.json', import.meta.url);

export const WORD_CATEGORIES = Object.freeze([
  'declarationKeywords',
  'controlKeywords',
  'builtinTypes',
  'booleans',
  'builtinFunctions',
  'preludeTypes',
]);

const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;

export function loadSpec(url = SPEC_URL) {
  return JSON.parse(readFileSync(url, 'utf8'));
}

export function allWords(spec) {
  return WORD_CATEGORIES.flatMap((category) => spec.words[category] ?? []);
}

function isNonEmptyList(value) {
  return Array.isArray(value) && value.length > 0;
}

function duplicates(words) {
  return [...new Set(words.filter((word, i) => words.indexOf(word) !== i))];
}

// Every problem that makes the specification unusable; empty when it is valid.
export function validateSpec(spec) {
  const problems = [];

  if (!isNonEmptyList(spec.fileExtensions))
    problems.push('fileExtensions must be a non-empty list');
  for (const category of WORD_CATEGORIES) {
    if (!isNonEmptyList(spec.words?.[category]))
      problems.push(`words.${category} must be a non-empty list`);
  }

  const words = allWords(spec);
  for (const word of words.filter((word) => !IDENTIFIER.test(word)))
    problems.push(`'${word}' is not an identifier`);
  for (const word of duplicates(words))
    problems.push(`'${word}' is listed more than once`);

  return problems;
}
