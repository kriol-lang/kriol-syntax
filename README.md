# kriol-syntax

The single source of the KriolLang syntax for editors and sites. It holds the
words of the language (keywords, types, booleans and prelude functions) in
[`kriol-syntax.json`](kriol-syntax.json) and generates from them:

| File | What it is | Used by |
|---|---|---|
| `dist/kriol.tmLanguage.json` | TextMate grammar | VS Code, the docs (Starlight), the website (Shiki), GitHub |
| `dist/index.js` + `index.d.ts` | the word lists as frozen arrays | the playground (CodeMirror), the website |

The compiler is the source of truth. A test reads its sources
(`rules/scanner.l`, `src/kriol/sema.cc`, `include/kriol/prelude.hh`) and fails
when they and `kriol-syntax.json` disagree.

The tree-sitter grammar ([kriol-tree-sitter](https://github.com/kriol-lang/kriol-tree-sitter))
stays a separate parser; its word lists should follow this repository.

## Usage

```sh
npm install github:kriol-lang/kriol-syntax
```

```js
import { controlKeywords, builtinTypes, comments } from 'kriol-syntax';
import grammar from 'kriol-syntax/kriol.tmLanguage.json' with { type: 'json' };
```

| Export | Content |
|---|---|
| `name`, `scopeName` | `kriol`, `source.kriol` |
| `fileExtensions` | `kriol`, `kr` |
| `comments` | `{ line: '//', block: ['/*', '*/'] }` |
| `declarationKeywords` | `fn`, `molda`, `inpristan` |
| `controlKeywords` | `si`, `sinon`, `pa`, `nkuantu`, `kebra`, `kontinua`, `divolvi`, `tenta`, `lansa` |
| `keywords` | both lists above |
| `builtinTypes` | `num`, `int`, `bool`, `textu`, `i8` … `u64`, `f32`, `f64`, `isize`, `usize` |
| `booleans` | `sin`, `nau` |
| `builtinFunctions` | `mostra`, `mostran`, `toma`, `sai`, `konfirma`, `paniku` |
| `preludeTypes` | `Erru` |

## Changing the language

When the compiler gains or loses a word:

1. Edit `kriol-syntax.json`.
2. Run `npm run build` to regenerate `dist/`. It is committed, so installing
   from git needs no build step.
3. Run `npm test`. With the compiler checked out next to this repository
   (`../kriol`), the tests also compare the words with it. Point
   `KRIOL_COMPILER_DIR` elsewhere if it lives in another place.

`npm run check:compiler [path]` runs only the comparison with the compiler.

Requires Node 22 or later and has no dependencies.

## License

[MIT](LICENSE)
