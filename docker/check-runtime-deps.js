const fs = require('fs');
const path = require('path');
const { builtinModules } = require('module');

const SPECIFIER = /\b(?:require|import)\("([^".][^"]*)"\)/g;

function packageName(specifier) {
  const parts = specifier.split('/');

  return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
}

function isBuiltin(specifier) {
  return (
    specifier.startsWith('node:') ||
    builtinModules.includes(specifier) ||
    builtinModules.includes(packageName(specifier))
  );
}

function compareRuntimeDeps(bundleSources, listed) {
  const loaded = new Set();

  for (const source of bundleSources) {
    for (const [, specifier] of source.matchAll(SPECIFIER)) {
      if (!isBuiltin(specifier)) {
        loaded.add(packageName(specifier));
      }
    }
  }

  return {
    missing: [...loaded].filter(name => !listed.includes(name)).sort(),
    unused: listed.filter(name => !loaded.has(name)).sort(),
  };
}

function main([distDir, manifestPath]) {
  if (!distDir || !manifestPath) {
    console.error(
      'Usage: node docker/check-runtime-deps.js <dist dir> <app package.json>'
    );
    process.exit(2);
  }

  const bundleSources = fs
    .readdirSync(distDir)
    .filter(file => file.endsWith('.js'))
    .map(file => fs.readFileSync(path.join(distDir, file), 'utf8'));
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const { missing, unused } = compareRuntimeDeps(
    bundleSources,
    Object.keys(manifest.dependencies ?? {})
  );

  if (missing.length) {
    console.error(
      `${manifestPath} is missing packages ${distDir} loads at runtime: ${missing.join(', ')}`
    );
  }

  if (unused.length) {
    console.error(
      `${manifestPath} lists packages ${distDir} never loads: ${unused.join(', ')}`
    );
  }

  if (missing.length || unused.length) {
    console.error(
      'Add them to the catalog in pnpm-workspace.yaml and the app package.json (or remove them) — see .claude/docs/infrastructure.md'
    );
    process.exit(1);
  }
}

if (require.main === module) {
  main(process.argv.slice(2));
}

module.exports = { compareRuntimeDeps };
