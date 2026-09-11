const fs = require('fs');
const path = require('path');

// @yao-pkg/pkg cannot resolve subpath `imports` (the `#name` specifiers a package
// defines in its `imports` map, e.g. Prisma's `#main-entry-point`). For each package
// listed here we read its `imports` map and rewrite every `require('#name')`,
// `import ... from '#name'` and `import('#name')` in its JS files to the file that
// map resolves to for Node, so pkg can resolve them.
// Add any future package with the same limitation to this array.
const PACKAGES = ['.prisma/client'];

function fail(message) {
  console.error(`ERROR: ${message} — pkg import workaround is stale (see docker/inline-pkg-imports.js)`);
  process.exit(1);
}

// Resolve the target a Node runtime would pick for the given condition kind
// ('require' for CJS, 'import' for ESM): the kind-specific node/default branch,
// then a top-level node, then the top-level default (Node's own fallback order).
function resolveTarget(entry, kind) {
  if (typeof entry === 'string') {
    return entry;
  }
  if (!entry || typeof entry !== 'object') {
    return null;
  }
  let cond = entry[kind];
  if (cond && typeof cond === 'object') {
    cond = cond.node || cond.default;
  }
  if (typeof cond === 'string') {
    return cond;
  }
  if (typeof entry.node === 'string') {
    return entry.node;
  }
  return typeof entry.default === 'string' ? entry.default : null;
}

function listSourceFiles(dir) {
  const files = [];
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      files.push(...listSourceFiles(full));
    } else if (/\.(c|m)?js$/.test(item.name)) {
      files.push(full);
    }
  }
  return files;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function relSpecifier(fromFile, base, target) {
  const rel = path
    .relative(path.dirname(fromFile), path.join(base, target))
    .split(path.sep)
    .join('/');
  return rel.startsWith('.') ? rel : `./${rel}`;
}

function patchImports(pkgName) {
  const base = path.resolve('node_modules', pkgName);

  let imports;
  try {
    imports = require(path.join(base, 'package.json')).imports || {};
  } catch (err) {
    fail(`${pkgName}: package not found at node_modules/${pkgName}`);
  }

  const specifiers = [];
  for (const key of Object.keys(imports)) {
    const cjsTarget = resolveTarget(imports[key], 'require');
    const esmTarget = resolveTarget(imports[key], 'import');
    if (!cjsTarget && !esmTarget) {
      fail(`${pkgName} ${key}: no resolvable Node target (conditions: ${Object.keys(imports[key] || {}).join(', ')})`);
    }
    for (const target of [cjsTarget, esmTarget]) {
      if (target && !fs.existsSync(path.join(base, target))) {
        fail(`${pkgName} ${key}: imports target ${target} does not exist on disk`);
      }
    }
    console.log(`  resolve ${key} -> require:${cjsTarget || '-'} import:${esmTarget || '-'}`);
    specifiers.push({ key, cjsTarget, esmTarget, hits: 0 });
  }

  let count = 0;
  for (const file of listSourceFiles(base)) {
    let code = fs.readFileSync(file, 'utf8');
    let fileHits = 0;

    for (const specifier of specifiers) {
      const esc = escapeRegExp(specifier.key);

      if (specifier.cjsTarget) {
        const spec = relSpecifier(file, base, specifier.cjsTarget);
        code = code.replace(
          new RegExp(`(require\\(\\s*)(['"])${esc}\\2(\\s*\\))`, 'g'),
          (match, open, quote, close) => {
            fileHits++;
            specifier.hits++;
            return `${open}${quote}${spec}${quote}${close}`;
          }
        );
      }

      if (specifier.esmTarget) {
        const spec = relSpecifier(file, base, specifier.esmTarget);
        const replacer = (match, open, quote) => {
          fileHits++;
          specifier.hits++;
          return `${open}${quote}${spec}${quote}`;
        };
        // `import ... from '#name'` and `export ... from '#name'`
        code = code.replace(new RegExp(`(from\\s*)(['"])${esc}\\2`, 'g'), replacer);
        // dynamic `import('#name')`
        code = code.replace(new RegExp(`(import\\(\\s*)(['"])${esc}\\2`, 'g'), replacer);
      }
    }

    if (fileHits > 0) {
      fs.writeFileSync(file, code);
      console.log(`  rewrite ${pkgName}/${path.relative(base, file)} (${fileHits}x)`);
      count += fileHits;
    }
  }

  for (const specifier of specifiers) {
    if (specifier.hits === 0) {
      console.log(`  unused  ${specifier.key} (in imports map but no require()/import found)`);
    }
  }

  return count;
}

for (const pkgName of PACKAGES) {
  console.log(`Inlining #imports for ${pkgName}`);
  const count = patchImports(pkgName);
  if (count === 0) {
    fail(`${pkgName}: no subpath imports rewritten (imports layout changed or package missing)`);
  }
  console.log(`Rewrote ${count} subpath imports for ${pkgName}`);
}
