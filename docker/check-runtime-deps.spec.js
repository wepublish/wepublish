const { compareRuntimeDeps, peerNames } = require('./check-runtime-deps');

describe('peerNames', () => {
  it('includes optional peers declared only in peerDependenciesMeta', () => {
    expect(peerNames({
        peerDependencies: { '@nestjs/core': '^12' },
        peerDependenciesMeta: {
          '@as-integrations/express5': { optional: true },
        },
      })).toEqual(['@nestjs/core', '@as-integrations/express5']);
  });

  it('copes with a manifest without peers', () => {
    expect(peerNames({})).toEqual([]);
  });
});

describe('compareRuntimeDeps', () => {
  it('passes when the bundle loads exactly what the manifest lists', () => {
    const bundle = [
      'const a = require("express");',
      'const b = require("@nestjs/core");',
    ];

    expect(compareRuntimeDeps(bundle, ['@nestjs/core', 'express'])).toEqual({
      missing: [],
      unused: [],
    });
  });

  it('reports a package the bundle loads but the manifest does not list', () => {
    const bundle = ['require("express"); require("cors");'];

    expect(compareRuntimeDeps(bundle, ['express']).missing).toEqual(['cors']);
  });

  it('reports a listed package the bundle never loads', () => {
    const bundle = ['require("express");'];

    expect(compareRuntimeDeps(bundle, ['express', 'react']).unused).toEqual([
      'react',
    ]);
  });

  it('accepts a listed package that a loaded package declares as a peer', () => {
    const bundle = ['require("@nestjs/core");'];
    const peersOf = name =>
      name === '@nestjs/core' ? ['@nestjs/platform-express'] : [];

    expect(compareRuntimeDeps(
        bundle,
        ['@nestjs/core', '@nestjs/platform-express'],
        peersOf
      )).toEqual({ missing: [], unused: [] });
  });

  it('still reports a listed peer whose package the bundle never loads', () => {
    const bundle = ['require("express");'];
    const peersOf = name =>
      name === '@nestjs/core' ? ['@nestjs/platform-express'] : [];

    expect(compareRuntimeDeps(bundle, ['express', '@nestjs/platform-express'], peersOf)
        .unused).toEqual(['@nestjs/platform-express']);
  });

  it('reduces subpath imports to their package name', () => {
    const bundle = [
      'require("@sentry/nestjs/setup"); require("date-fns/locale");',
    ];

    expect(compareRuntimeDeps(bundle, ['@sentry/nestjs', 'date-fns'])).toEqual({ missing: [], unused: [] });
  });

  it('counts dynamic imports', () => {
    const bundle = ['await import("sharp");'];

    expect(compareRuntimeDeps(bundle, []).missing).toEqual(['sharp']);
  });

  it('ignores single-quoted requires from third-party code inlined into the bundle', () => {
    const bundle = [
      "try { convert = require('encoding').convert; } catch (e) {}",
    ];

    expect(compareRuntimeDeps(bundle, []).missing).toEqual([]);
  });

  it('ignores node builtins and relative chunks', () => {
    const bundle = [
      'require("fs"); require("node:path"); require("fs/promises"); require("./3.js");',
    ];

    expect(compareRuntimeDeps(bundle, [])).toEqual({
      missing: [],
      unused: [],
    });
  });
});
