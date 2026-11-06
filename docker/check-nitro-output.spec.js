const { findUnresolvableRequires } = require('./check-nitro-output');

describe('findUnresolvableRequires', () => {
  it('reports a bare require rolldown left in an inlined CJS module', () => {
    const bundle = ['var _react = _interopRequireDefault(__require("react"));'];

    expect(findUnresolvableRequires(bundle, [])).toEqual(['react']);
  });

  it('accepts a require whose package nitro traced into the output', () => {
    const bundle = ['const redis = __require("@keyv/redis");'];

    expect(findUnresolvableRequires(bundle, ['@keyv/redis'])).toEqual([]);
  });

  it('accepts a subpath of a traced package', () => {
    const bundle = ['__require("i18n-iso-countries/langs/de.json");'];

    expect(findUnresolvableRequires(bundle, ['i18n-iso-countries'])).toEqual([]);
  });

  it('ignores node builtins, with and without the node: prefix', () => {
    const bundle = ['__require("fs"); __require("node:async_hooks");'];

    expect(findUnresolvableRequires(bundle, [])).toEqual([]);
  });

  it('ignores a require written in prose in a doc comment', () => {
    const bundle = ["* const { extendTheme } = require('@mui/material/styles');"];

    expect(findUnresolvableRequires(bundle, [])).toEqual([]);
  });

  it('ignores a specifier that is an interpolation in generated source', () => {
    const bundle = ['const src = `const x = require("${dcModule}")`;'];

    expect(findUnresolvableRequires(bundle, [])).toEqual([]);
  });

  it('reports a static ESM import of an untraced package', () => {
    const bundle = [
      "import * as Sentry from '@sentry/tanstackstart-react';\nSentry.init({});",
    ];

    expect(findUnresolvableRequires(bundle, [])).toEqual([
      '@sentry/tanstackstart-react',
    ]);
  });

  it('accepts a static ESM import nitro traced into the output', () => {
    const bundle = ["import { init } from '@sentry/node';"];

    expect(findUnresolvableRequires(bundle, ['@sentry/node'])).toEqual([]);
  });

  it('reports a re-export from an untraced package', () => {
    const bundle = ["export { wrapFetchWithSentry } from '@sentry/tanstack';"];

    expect(findUnresolvableRequires(bundle, [])).toEqual(['@sentry/tanstack']);
  });

  it('ignores a static import of a relative module or a builtin', () => {
    const bundle = [
      "import './polyfill.js';\nimport { AsyncLocalStorage } from 'node:async_hooks';",
    ];

    expect(findUnresolvableRequires(bundle, [])).toEqual([]);
  });

  it('ignores the word import inside a doc comment', () => {
    const bundle = [
      " * Loaded through `node --import` before the server bundle.",
      " * which `import('@wepublish/thing')` used to do.",
    ];

    expect(findUnresolvableRequires(bundle, [])).toEqual([]);
  });

  it('reports each missing package once and sorted', () => {
    const bundle = [
      '__require("react"); __require("react");',
      'require("stylis");',
    ];

    expect(findUnresolvableRequires(bundle, [])).toEqual(['react', 'stylis']);
  });
});
