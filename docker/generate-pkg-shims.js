const fs = require('fs');
const path = require('path');

// @yao-pkg/pkg cannot resolve packages that expose their entry points through a
// subpath `exports` map (it uses legacy directory resolution). For each package
// listed here we generate physical `<pkg>/<subpath>/index.js` shims that re-export
// the file the `exports` map points at, so pkg can resolve them.
// Add any future package with the same limitation to this array.
const PACKAGES = ['@tiptap/pm'];

// Pick the CommonJS/Node target from a (possibly conditional) exports entry.
function resolveExport(entry) {
  let target = typeof entry === 'string' ? entry : entry && (entry.require || entry.import || entry.default);
  if (target && typeof target === 'object') {
    target = target.require || target.default || target.import;
  }
  return typeof target === 'string' ? target : null;
}

function generateShims(pkgName) {
  const base = path.resolve('node_modules', pkgName);

  let exp;
  try {
    exp = require(path.join(base, 'package.json')).exports || {};
  } catch (err) {
    console.log(`  package not found at node_modules/${pkgName}`);
    return 0;
  }

  let count = 0;
  for (const key of Object.keys(exp)) {
    if (!key.startsWith('./') || key === './package.json') {
      continue;
    }

    const subpath = key.slice(2);
    const target = resolveExport(exp[key]);
    if (!target) {
      console.log(`  skip    ${pkgName}/${subpath} (no resolvable require/import target)`);
      continue;
    }

    const dir = path.join(base, subpath);
    fs.mkdirSync(dir, { recursive: true });
    const rel = path.relative(dir, path.join(base, target)).split(path.sep).join('/');
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
    console.error(
      `ERROR: no subpath shims created for ${pkgName} — pkg workaround is stale (exports layout changed or package missing)`
    );
    process.exit(1);
  }
  console.log(`Created ${count} subpath shims for ${pkgName}`);
}
