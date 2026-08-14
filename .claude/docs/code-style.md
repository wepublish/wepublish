# Code Style

Source code formatting and linting should follow the existing conventions in the codebase.

- Always use curly braces around conditional blocks, even for single statements.
- Never add comments **unless** they are needed for the linter or to bypass the Typescript compiler.

## Typescript

- Prefer `unknown` over `any`
- Always use `@ts-expect-error` over `@ts-ignore`

## Emotion

-

## React

- Avoid using `useEffect` when it can be solved otherwise. Reference [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect) if unsure.

## Nest

### GraphQL Models

- Prefer model re-use via interfaces and extending models than writing from scratch
