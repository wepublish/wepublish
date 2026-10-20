const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { compareRuntimeDeps } = require('./check-runtime-deps');

describe('compareRuntimeDeps', () => {
  it('passes when the bundle loads exactly what the manifest lists', () => {
    const bundle = [
      'const a = require("express");',
      'const b = require("@nestjs/core");',
    ];

    assert.deepEqual(compareRuntimeDeps(bundle, ['@nestjs/core', 'express']), {
      missing: [],
      unused: [],
    });
  });

  it('reports a package the bundle loads but the manifest does not list', () => {
    const bundle = ['require("express"); require("cors");'];

    assert.deepEqual(compareRuntimeDeps(bundle, ['express']).missing, ['cors']);
  });

  it('reports a listed package the bundle never loads', () => {
    const bundle = ['require("express");'];

    assert.deepEqual(compareRuntimeDeps(bundle, ['express', 'react']).unused, [
      'react',
    ]);
  });

  it('reduces subpath imports to their package name', () => {
    const bundle = [
      'require("@sentry/nestjs/setup"); require("date-fns/locale");',
    ];

    assert.deepEqual(
      compareRuntimeDeps(bundle, ['@sentry/nestjs', 'date-fns']),
      { missing: [], unused: [] }
    );
  });

  it('counts dynamic imports', () => {
    const bundle = ['await import("sharp");'];

    assert.deepEqual(compareRuntimeDeps(bundle, []).missing, ['sharp']);
  });

  it('ignores single-quoted requires from third-party code inlined into the bundle', () => {
    const bundle = [
      "try { convert = require('encoding').convert; } catch (e) {}",
    ];

    assert.deepEqual(compareRuntimeDeps(bundle, []).missing, []);
  });

  it('ignores node builtins and relative chunks', () => {
    const bundle = [
      'require("fs"); require("node:path"); require("fs/promises"); require("./3.js");',
    ];

    assert.deepEqual(compareRuntimeDeps(bundle, []), {
      missing: [],
      unused: [],
    });
  });
});
