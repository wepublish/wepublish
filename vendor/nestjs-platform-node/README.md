# Vendored `@nestjs/platform-node`

This directory is a **vendored copy of an unreleased NestJS package**. It is not
a We.Publish library and nothing here should be edited by hand.

## Why this exists

`@nestjs/platform-node` is a native `node:http` HTTP adapter for NestJS. It is
not published to npm: it lives in the open, unmerged pull request
[nestjs/nest#18063](https://github.com/nestjs/nest/pull/18063) on branch
`feat/platform-node`. There is no installable artifact, so the only way to
evaluate it is to build it from source.

| | |
| --- | --- |
| Upstream repo | <https://github.com/nestjs/nest> |
| Upstream branch | `feat/platform-node` |
| Upstream commit | `2b10fb228353fcaedd2817cc22f89ad1cca9a900` (2026-10-14) |
| Upstream path | `packages/platform-node` |
| Upstream version | `12.1.3` |
| License | MIT (unchanged, Copyright (c) 2017-2025 Kamil Myśliwiec) |

`src/` is a byte-for-byte copy of `packages/platform-node` from that commit,
minus `test/`, `package.json`, `tsconfig*.json` and `Readme.md`. The
`package.json` and `tsconfig.json` next to this file are ours, so the package
builds standalone instead of against the Nest monorepo's project references.

## Regenerating

Do not patch `src/` in place. Re-run the vendoring script, which re-clones the
upstream branch at a pinned commit:

```bash
./tools/vendor-platform-node.sh
```

To move to a newer upstream commit, pass it explicitly:

```bash
./tools/vendor-platform-node.sh <commit-sha>
```

The script rewrites this README's provenance table, so the recorded commit is
always the one the sources came from.

## Status

This is a **spike**, not a supported dependency. It must not be merged to
`master`. See the pull request this branch belongs to for the benchmark results
and the list of blockers — most importantly that `@nestjs/apollo` refuses any
adapter whose `getType()` is not `express` or `fastify`.

When upstream publishes the package, delete this directory and depend on
`@nestjs/platform-node` from npm instead.
