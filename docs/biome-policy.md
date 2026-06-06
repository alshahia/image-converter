# Biome Policy

This project uses [Biome](https://biomejs.dev/) for linting and formatting.
Run `bun run lint` and `bun run format` before pushing. CI runs both.

## Rules at a glance

| Rule | Severity | Why |
| --- | --- | --- |
| `correctness/noUnusedImports` | `error` | Unused imports dead-code. |
| `correctness/noUnusedVariables` | `error` | Same. |
| `style/useImportType` | `error` | Enforces `import type` for type-only imports; smaller compiled output, clearer intent. |
| `suspicious/noExplicitAny` | `warn` | See below. |
| `recommended` (everything else) | `error` | Biome's safe defaults. |

## Why `noExplicitAny` is `warn`, not `error`

We use `any` deliberately in two places:

1. **ONNX Runtime Web types.** `ort.InferenceSession` is loosely typed
   upstream; the inference `run()` method takes a `Record<string, ort.Tensor>`
   whose values are dynamic per-model. Forcing precise typing here would
   require re-declaring internal ONX types, which is brittle and out of
   scope for our project.
2. **FFmpeg.wasm event payloads.** `ffmpeg.on('log', ({ message }) => ...)`
   delivers a `LogEvent` whose `type` field is a string union we
   narrow with our own `LogLevel` type, not a generated one. The upstream
   `LogEvent` has a few `any` fields for the message body that we don't
   consume.

If you add a new `any` outside these zones, the warning will fire.
Suppress it with a one-line `// biome-ignore lint/suspicious/noExplicitAny: <reason>`
comment that explains why — not just "I don't know the type."

## When to bump a rule to `error`

If a `warn` rule fires repeatedly on code we expect to keep, the fix is
one of:

1. Refactor the offending code so the rule is satisfied.
2. Suppress with a targeted `biome-ignore` comment.
3. As a last resort, open a discussion in the next V&V cycle to bump the
   rule to `error`. Don't bump it ad-hoc — that hides the warning from
   everyone, not just your use case.

## What's explicitly not lint-enforced

- **Test files** are not exempt (we want clean tests too). If a test
  uses `any` to mock a complex generic, suppress with a comment.
- **Generated code** (e.g. `coverage/`, `dist/`, `public/ffmpeg/`) is
  ignored via `files.ignore` in `biome.json`. Don't commit generated
  source.
- **CSS** is not linted (Biome's CSS linter is off; we use Tailwind's
  class order via `prettier-plugin-tailwindcss` if needed, currently
  n/a).

## Local vs CI

Biome runs the same in both. No drift. If you see a CI failure
locally, run `bun run format && bun run lint` to reproduce it.
