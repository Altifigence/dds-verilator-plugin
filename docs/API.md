# Lint planner API

```js
import { LIMITS, planVerilatorLint } from '@altifigence/verilator-plan-adapter';
```

`planVerilatorLint(input)` synchronously validates a saved source bundle and
returns an immutable argument plan. It throws
`Error('Invalid Verilator lint plan inputs')` for invalid input. It does not
check HDL syntax, resolve includes, choose an executable or run a process.

## Input

All listed keys are required. Extra keys are rejected in the input and source
records. `input`, source records and `defines` must be plain objects.

| Field | Required value |
| --- | --- |
| `schema` | `'altifigence.verilator-lint-input.v1'` |
| `top` | HDL identifier: `[A-Za-z_][A-Za-z0-9_$]{0,127}` |
| `sources` | 1–512 `{ path, content, sha256 }` records |
| `sources[].path` | Portable relative `.v`, `.sv`, `.vh` or `.svh` path |
| `sources[].content` | Exact saved UTF-8 text, without NUL or unpaired UTF-16 surrogates |
| `sources[].sha256` | Lowercase 64-character SHA-256 of `content` encoded as UTF-8 |
| `roots` | Nonempty, unique list of captured `.v`/`.sv` source paths, in compilation order |
| `includeDirs` | Unique relative directory paths, or `'.'`; a directory cannot also be a captured file |
| `defines` | Up to 128 identifier keys; values are `null` or 1–256 characters matching `[A-Za-z0-9_.'+-]` |

Paths use `/` separators, with ASCII letters, digits, `_`, `.` and `-` in each
segment; every segment begins with a letter, digit or `_`. Maximum path length
is 256 UTF-8 bytes. Absolute paths, traversal, Windows device names and trailing
dots are rejected. Source paths must remain unique on case-insensitive filesystems
and cannot overlap as both a file and its parent directory.

Total source content must be 1–4,194,304 UTF-8 bytes. Roots and include directories
each have a maximum of 512 entries. `LIMITS` exposes these limits and is frozen.
The implementation does not infer roots, include directories or defines.

## Return value

| Field | Meaning |
| --- | --- |
| `schema` | `'altifigence.verilator-lint-plan.v1'` |
| `top` | Captured top identifier |
| `sources` | Path-sorted `{ path, sha256, byteLength }` identities; source text is omitted |
| `totalBytes` | Sum of source UTF-8 byte lengths |
| `roots`, `includeDirs` | Copies of the input arrays, retaining their order |
| `defines` | Copy with keys sorted lexicographically |
| `argv` | Fixed lint options, include options, sorted defines, then roots |
| `authority` | Always `'argument-plan-only'` |
| `executionAuthorized` | Always `false` |
| `planSha256` | SHA-256 of `JSON.stringify(recipe)`, where `recipe` is this result without `planSha256` |

The result, arrays, define map and source records are frozen. Reordering source
records or define keys leaves the plan digest unchanged; changing compilation
root order or include directory order changes it. A `null` define produces
`-DNAME`; a string produces `-DNAME=value`.

Pass `argv` directly as an argument array only after the host has separately
authorized and staged execution. Do not turn it into a shell command. The plan
does not identify a tool binary, sandbox, resource reservation or staged directory.

[`examples/lint-plan.mjs`](../examples/lint-plan.mjs) is a complete producer of
this input format using the bundled saved HDL files.
