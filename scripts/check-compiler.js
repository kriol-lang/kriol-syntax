// Usage: node scripts/check-compiler.js [path/to/kriol]   (default: ../kriol)

import { resolve } from 'node:path';
import { compareWithCompiler, readCompilerWords } from '../src/compiler.js';
import { loadSpec } from '../src/spec.js';

const compilerDir = resolve(process.argv[2] ?? '../kriol');
const problems = compareWithCompiler(loadSpec(), readCompilerWords(compilerDir));

if (problems.length > 0) {
  console.error(`kriol-syntax.json differs from the compiler at ${compilerDir}:\n  ${problems.join('\n  ')}`);
  process.exit(1);
}
console.log(`kriol-syntax.json matches the compiler at ${compilerDir}`);
