const fs = require('fs');
const path = require('path');

// @yao-pkg/pkg cannot resolve subpath `imports` (the `#name` specifiers a package
// defines in its `imports` map, e.g. Prisma's `#main-entry-point`). For each package
// listed here we read its `imports` map and rewrite every `require('#name')` in its
// JS files to the file that map resolves to, so pkg can resolve them.
// Add any future package with the same limitation to this array.
const PACKAGES = ['.prisma/client'];

// Pick the CommonJS/Node target from a (possibly conditional) imports entry.
function resolveImport(entry) {
  if (typeof entry === 'string') {
    return entry;
  }
  if (!entry || typeof entry !== 'object') {
    return null;
  }
  const req = entry.require || entry;
  if (typeof req === 'string') {
    return req;
  }
  return req.node || req.default || entry.node || entry.default || null;
}

function listJsFiles(dir) {
  const files = [];
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      files.push(...listJsFiles(full));
    } else if (/\.c?js$/.test(item.name)) {
      files.push(full);
    }
  }
  return files;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function patchImports(pkgName) {
  const base = path.resolve('node_modules', pkgName);

  let imports;
  try {
    imports = require(path.join(base, 'package.json')).imports || {};
  } catch (err) {
    console.log(`  package not found at node_modules/${pkgName}`);
    return 0;
  }

  const specifiers = [];
  for (const key of Object.keys(imports)) {
    const target = resolveImport(imports[key]);
    if (!target) {
      console.log(`  skip    ${key} (no resolvable require/node target)`);
      continue;
    }
    console.log(`  resolve ${key} -> ${target}`);
    specifiers.push({ key, target, hits: 0 });
  }

  let count = 0;
  for (const file of listJsFiles(base)) {
    let code = fs.readFileSync(file, 'utf8');
    let changed = false;

    for (const specifier of specifiers) {
      const rel = path
        .relative(path.dirname(file), path.join(base, specifier.target))
        .split(path.sep)
        .join('/');
      const spec = rel.startsWith('.') ? rel : `./${rel}`;
      const pattern = new RegExp(
        `(require\\(\\s*['"])${escapeRegExp(specifier.key)}(['"]\\s*\\))`,
        'g'
      );
      const matches = code.match(pattern);
      if (matches) {
        code = code.replace(pattern, `$1${spec}$2`);
        specifier.hits += matches.length;
        count += matches.length;
        changed = true;
        console.log(
          `  rewrite ${pkgName}/${path.relative(base, file)}: require('${specifier.key}') -> require('${spec}') (${matches.length}x)`
        );
      }
    }

    if (changed) {
      fs.writeFileSync(file, code);
    }
  }

  for (const specifier of specifiers) {
    if (specifier.hits === 0) {
      console.log(
        `  unused  ${specifier.key} (in imports map but no require() found in any file)`
      );
    }
  }

  return count;
}

for (const pkgName of PACKAGES) {
  console.log(`Inlining #imports for ${pkgName}`);
  const count = patchImports(pkgName);
  if (count === 0) {
    console.error(
      `ERROR: no subpath imports rewritten for ${pkgName} — pkg workaround is stale (imports layout changed or package missing)`
    );
    process.exit(1);
  }
  console.log(`Rewrote ${count} subpath imports for ${pkgName}`);
}
