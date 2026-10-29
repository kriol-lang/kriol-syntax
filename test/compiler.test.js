import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  compareWithCompiler,
  parsePrelude,
  parseReservedWords,
  parseScannerWords,
  readCompilerWords,
} from '../src/compiler.js';
import { loadSpec } from '../src/spec.js';

const SCANNER = `
"//"[^\\n]*      /* single-line comment */;
"fn"            return TOKENIZE(FN);
"si"            return TOKENIZE(SI);
"int"           SAVE_TOKEN;   return TYPE_INT;
"i8"            SAVE_TOKEN;   return TYPE_PRIMITIVE;
"sin"           { yylval.string = new std::string("1"); return BOOL_LIT; }
"+"             return TOKENIZE(PLUS);
`;

const SEMA = `
static const std::unordered_set<std::string> reservedKeywords = {
    // Language keywords.
    "si", "fn",

    // Type names and literals.
    "int", "i8", "sin"
};
static const char* other = "not reserved";
`;

const PRELUDE = `
inline constexpr const char* ErrorTypeName = "Erru";
inline Builtin lookupBuiltin(const std::string& name) {
    if (name == "mostra") return Builtin::Mostra;
    return Builtin::None;
}
`;

const COMPILER_WORDS = {
  keywords: ['fn', 'si'],
  builtinTypes: ['int', 'i8'],
  booleans: ['sin'],
  reserved: ['si', 'fn', 'int', 'i8', 'sin'],
  builtinFunctions: ['mostra'],
  preludeTypes: ['Erru'],
};

function specWith(words) {
  return {
    words: {
      declarationKeywords: ['fn'],
      controlKeywords: ['si'],
      builtinTypes: ['int', 'i8'],
      booleans: ['sin'],
      builtinFunctions: ['mostra'],
      preludeTypes: ['Erru'],
      ...words,
    },
  };
}

test('reads the scanner words by the token they produce', () => {
  assert.deepEqual(parseScannerWords(SCANNER), {
    keywords: ['fn', 'si'],
    builtinTypes: ['int', 'i8'],
    booleans: ['sin'],
  });
});

test('reads the reserved words of the semantic analyser', () => {
  assert.deepEqual(parseReservedWords(SEMA), ['si', 'fn', 'int', 'i8', 'sin']);
});

test('reads the prelude functions and types', () => {
  assert.deepEqual(parsePrelude(PRELUDE), { builtinFunctions: ['mostra'], preludeTypes: ['Erru'] });
});

test('finds no difference when the specification matches the compiler', () => {
  assert.deepEqual(compareWithCompiler(specWith({}), COMPILER_WORDS), []);
});

test('reports a keyword the compiler has and the specification lacks', () => {
  const spec = specWith({ controlKeywords: [] });

  assert.deepEqual(compareWithCompiler(spec, COMPILER_WORDS), [
    "keywords: 'si' is in the compiler but not in the specification",
    "reserved words: 'si' is in the compiler but not in the specification",
  ]);
});

test('reports a builtin function the compiler does not know', () => {
  const spec = specWith({ builtinFunctions: ['mostra', 'skribi'] });

  assert.deepEqual(compareWithCompiler(spec, COMPILER_WORDS), [
    "builtinFunctions: 'skribi' is in the specification but not in the compiler",
  ]);
});

test('reports a word the scanner and the semantic analyser disagree on', () => {
  const compiler = { ...COMPILER_WORDS, reserved: ['si', 'fn', 'int', 'i8'] };

  assert.deepEqual(compareWithCompiler(specWith({}), compiler), [
    "reserved words: 'sin' is in the specification but not in the compiler",
  ]);
});

const compilerDir = resolve(process.env.KRIOL_COMPILER_DIR ?? '../kriol');

test('the specification matches the compiler sources', { skip: !existsSync(compilerDir) && `no compiler at ${compilerDir}` }, () => {
  assert.deepEqual(compareWithCompiler(loadSpec(), readCompilerWords(compilerDir)), []);
});
