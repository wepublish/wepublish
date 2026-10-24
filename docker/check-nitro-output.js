const fs = require('fs');
const path = require('path');
const { builtinModules } = require('module');

const SPECIFIER = /(?:__require|\brequire|\bimport)\("([^"]+)"\)/g;

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

function findUnresolvableRequires(bundleSources, availablePackages) {
  const available = new Set(availablePackages);
  const missing = new Set();

  for (const source of bundleSources) {
    for (const [, specifier] of source.matchAll(SPECIFIER)) {
      if (
        specifier.startsWith('.') ||
        specifier.startsWith('/') ||
        specifier.includes('${')
      ) {
        continue;
      }

      if (isBuiltin(specifier)) {
        continue;
      }

      const name = packageName(specifier);

      if (!available.has(name)) {
        missing.add(name);
      }
    }
  }

  return [...missing].sort();
}

function bundleFiles(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap(entry => {
      const full = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        return entry.name === 'node_modules' ? [] : bundleFiles(full);
      }

      return /\.(mjs|js|cjs)$/.test(entry.name) ? [full] : [];
    });
}

function tracedPackages(serverDir) {
  const root = path.join(serverDir, 'node_modules');

  if (!fs.existsSync(root)) {
    return [];
  }

  return fs.readdirSync(root).flatMap(entry =>
    entry.startsWith('@') ?
      fs.readdirSync(path.join(root, entry)).map(scoped => `${entry}/${scoped}`)
    : [entry]
  );
}

function main([outputDir]) {
  if (!outputDir) {
    console.error('Usage: node docker/check-nitro-output.js <.output dir>');
    process.exit(2);
  }

  const serverDir = path.join(outputDir, 'server');
  const sources = bundleFiles(serverDir).map(file =>
    fs.readFileSync(file, 'utf8')
  );
  const missing = findUnresolvableRequires(sources, tracedPackages(serverDir));

  if (missing.length) {
    console.error(
      `${serverDir} calls require() at runtime for packages that are neither bundled nor traced into it: ${missing.join(', ')}`
    );
    console.error(
      'Add them to `ssr.noExternal` so they are bundled, or to the nitro `traceDeps` so they ship beside the bundle — see .claude/docs/tanstack-start-migration.md'
    );
    process.exit(1);
  }
}

if (require.main === module) {
  main(process.argv.slice(2));
}

module.exports = { findUnresolvableRequires, tracedPackages };
