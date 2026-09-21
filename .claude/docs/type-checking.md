# Type checking

Always use `nx` to type-check, run the `nx typecheck <library>` command when present. When a library is missing the typecheck command add when it makes sense.

Library type checking lives on a `typecheck` target, never on `build`. Application builds (`nx build <app>`) depend on `^build`, so naming a library's `@nx/js:tsc` target `build` puts the whole transitive library graph on the critical path of every app and Docker image build — that cost minutes per build until it was moved to `typecheck`.

`typecheck` keeps `dependsOn: ["^typecheck"]`: `@nx/js:tsc` rewrites the `tsconfig` paths of any dependency that has a target of the same name to point at its `dist/` output, so the dependencies must actually be compiled first or resolution fails with TS2307.
