const fs = require('fs');
const path = require('path');

// @yao-pkg/pkg cannot resolve packages that expose their entry points through a
// subpath `exports` map (it uses legacy directory resolution). For each package
// listed here we generate physical `<pkg>/<subpath>/index.js` shims that re-export
// the file the `exports` map points at, so pkg can resolve them.
// Add any future package with the same limitation to this array.
const PACKAGES = ['@tiptap/pm'];

function readExports(base) {
  try {
    return require(path.join(base, 'package.json')).exports || {};
  } catch (err) {
    return null;
  }
}

function generateShims(pkgName) {
  const base = path.resolve('node_modules', pkgName);
  const exp = readExports(base);
  if (!exp) {
    return 0;
  }

  let count = 0;
  for (const key of Object.keys(exp)) {
    if (!key.startsWith('./') || key === './package.json') {
      continue;
    }

    const entry = exp[key];
    let target =
      typeof entry === 'string' ? entry : entry.require || entry.import || entry.default;
    if (target && typeof target === 'object') {
      target = target.require || target.default || target.import;
    }
    if (!target) {
      continue;
    }

    const dir = path.join(base, key.slice(2));
    fs.mkdirSync(dir, { recursive: true });
    const rel = path.relative(dir, path.join(base, target)).split(path.sep).join('/');
    fs.writeFileSync(
      path.join(dir, 'index.js'),
      `module.exports = require(${JSON.stringify(rel)})\n`
    );
    count++;
  }

  return count;
}

for (const pkgName of PACKAGES) {
  const count = generateShims(pkgName);
  if (count === 0) {
    console.error(
      `ERROR: no subpath shims created for ${pkgName} — pkg workaround is stale (exports layout changed or package missing)`
    );
    process.exit(1);
  }
  console.log(`Created ${count} subpath shims for ${pkgName}`);
}
