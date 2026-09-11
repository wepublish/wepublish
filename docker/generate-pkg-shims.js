const fs = require('fs');
const path = require('path');

// @yao-pkg/pkg cannot resolve packages that expose their entry points through a
// subpath `exports` map (it uses legacy directory resolution). For each package
// listed here we generate physical `<pkg>/<subpath>/index.js` shims that re-export
// the file the `exports` map points at, so pkg can resolve them.
// Add any future package with the same limitation to this array.
const PACKAGES = ['@tiptap/pm', '@sentry/nestjs'];

function fail(message) {
  console.error(`ERROR: ${message} — pkg shim workaround is stale (see docker/generate-pkg-shims.js)`);
  process.exit(1);
}

// Resolve the runtime (CJS/Node) target from a (possibly conditional) exports
// entry. Returns { target } when shimmable, { skip } for types-only entries that
// need no runtime shim, or { error } when the shape is not understood (so it is
// never silently ignored).
function resolveExport(entry) {
  if (typeof entry === 'string') {
    return { target: entry };
  }
  if (!entry || typeof entry !== 'object') {
    return { error: `unexpected exports value ${JSON.stringify(entry)}` };
  }

  let target = entry.require || entry.import || entry.default;
  if (target && typeof target === 'object') {
    target = target.require || target.default || target.import;
  }
  if (typeof target === 'string') {
    return { target };
  }

  // A types-only entry has no runtime target and legitimately needs no shim.
  // Anything else is a shape we do not understand and must surface loudly.
  const runtimeConditions = Object.keys(entry).filter(key => key !== 'types');
  if (runtimeConditions.length === 0) {
    return { skip: true };
  }
  return { error: `no resolvable require/import target (conditions: ${Object.keys(entry).join(', ')})` };
}

function generateShims(pkgName) {
  const base = path.resolve('node_modules', pkgName);

  let exp;
  try {
    exp = require(path.join(base, 'package.json')).exports || {};
  } catch (err) {
    fail(`${pkgName}: package not found at node_modules/${pkgName}`);
  }

  let count = 0;
  for (const key of Object.keys(exp)) {
    if (!key.startsWith('./') || key === './package.json') {
      continue;
    }

    const subpath = key.slice(2);
    const resolved = resolveExport(exp[key]);
    if (resolved.error) {
      fail(`${pkgName}/${subpath}: ${resolved.error}`);
    }
    if (resolved.skip) {
      console.log(`  skip    ${pkgName}/${subpath} (types-only, no runtime target)`);
      continue;
    }

    const targetPath = path.join(base, resolved.target);
    if (!fs.existsSync(targetPath)) {
      fail(`${pkgName}/${subpath}: exports target ${resolved.target} does not exist on disk`);
    }

    const dir = path.join(base, subpath);
    fs.mkdirSync(dir, { recursive: true });
    const rel = path.relative(dir, targetPath).split(path.sep).join('/');
    fs.writeFileSync(
      path.join(dir, 'index.js'),
      `module.exports = require(${JSON.stringify(rel)})\n`
    );
    console.log(`  shim    ${pkgName}/${subpath}/index.js -> ${rel}`);
    count++;
  }

  return count;
}

for (const pkgName of PACKAGES) {
  console.log(`Generating exports shims for ${pkgName}`);
  const count = generateShims(pkgName);
  if (count === 0) {
    fail(`${pkgName}: no subpath shims created (exports layout changed or package missing)`);
  }
  console.log(`Created ${count} subpath shims for ${pkgName}`);
}
