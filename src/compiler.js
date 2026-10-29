// Reads the words the compiler actually knows from its sources, so the
// specification can be checked against them. The compiler is the source of
// truth: when they differ, the specification is the one to fix.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const SCANNER_PATH = 'rules/scanner.l';
const SEMA_PATH = 'src/kriol/sema.cc';
const PRELUDE_PATH = 'include/kriol/prelude.hh';

// A scanner rule for a fixed word, such as: "int"  SAVE_TOKEN; return TYPE_INT;
const SCANNER_WORD_RULE = /^"([A-Za-z_][A-Za-z0-9_]*)"\s+(.*)$/;

function quotedStrings(text) {
  return [...text.matchAll(/"([^"]*)"/g)].map(([, word]) => word);
}

export function parseScannerWords(scanner) {
  const words = { keywords: [], builtinTypes: [], booleans: [] };

  for (const line of scanner.split('\n')) {
    const rule = line.match(SCANNER_WORD_RULE);
    if (!rule) continue;

    const [, word, action] = rule;
    if (action.includes('BOOL_LIT')) words.booleans.push(word);
    else if (action.includes('TYPE_')) words.builtinTypes.push(word);
    else words.keywords.push(word);
  }
  return words;
}

export function parseReservedWords(sema) {
  const set = sema.match(/reservedKeywords\s*=\s*\{([\s\S]*?)\};/);
  if (!set) throw new Error('reservedKeywords was not found in the semantic analyser');
  return quotedStrings(set[1].replace(/\/\/[^\n]*/g, ''));
}

export function parsePrelude(prelude) {
  const builtinFunctions = [...prelude.matchAll(/name == "([^"]+)"\) return Builtin::/g)]
    .map(([, name]) => name);
  const preludeTypes = [...prelude.matchAll(/ErrorTypeName = "([^"]+)"/g)].map(([, name]) => name);
  return { builtinFunctions, preludeTypes };
}

export function readCompilerWords(compilerDir) {
  const read = (path) => readFileSync(join(compilerDir, path), 'utf8');

  return {
    ...parseScannerWords(read(SCANNER_PATH)),
    reserved: parseReservedWords(read(SEMA_PATH)),
    ...parsePrelude(read(PRELUDE_PATH)),
  };
}

function differences(label, inSpec, inCompiler) {
  const spec = new Set(inSpec);
  const compiler = new Set(inCompiler);

  return [
    ...inCompiler.filter((word) => !spec.has(word))
      .map((word) => `${label}: '${word}' is in the compiler but not in the specification`),
    ...inSpec.filter((word) => !compiler.has(word))
      .map((word) => `${label}: '${word}' is in the specification but not in the compiler`),
  ];
}

// Every difference between the specification and the compiler; empty when they agree.
export function compareWithCompiler(spec, compiler) {
  const { declarationKeywords, controlKeywords, builtinTypes, booleans, builtinFunctions, preludeTypes } = spec.words;
  const keywords = [...declarationKeywords, ...controlKeywords];

  return [
    ...differences('keywords', keywords, compiler.keywords),
    ...differences('builtinTypes', builtinTypes, compiler.builtinTypes),
    ...differences('booleans', booleans, compiler.booleans),
    ...differences('reserved words', [...keywords, ...builtinTypes, ...booleans], compiler.reserved),
    ...differences('builtinFunctions', builtinFunctions, compiler.builtinFunctions),
    ...differences('preludeTypes', preludeTypes, compiler.preludeTypes),
  ];
}
