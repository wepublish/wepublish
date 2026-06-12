const assert = require('node:assert/strict');
const test = require('node:test');

function loadDeployScript() {
  const scriptPath = require.resolve('./deploy_production');
  const originalArgv = process.argv;
  const originalExit = process.exit;

  delete require.cache[scriptPath];
  process.argv = ['node', scriptPath];
  process.exit = code => {
    throw new Error(`unexpected process.exit(${code})`);
  };

  try {
    return require('./deploy_production');
  } finally {
    process.argv = originalArgv;
    process.exit = originalExit;
    delete require.cache[scriptPath];
  }
}

test('exports pure helpers without starting a deployment at import time', () => {
  const deployScript = loadDeployScript();

  assert.equal(typeof deployScript.validateProjectName, 'function');
  assert.equal(typeof deployScript.filterCustomerChangelog, 'function');
});

test('validates project names before using them in git commands', () => {
  const { validateProjectName } = loadDeployScript();

  assert.equal(validateProjectName('bajour'), 'bajour');
  assert.equal(
    validateProjectName('winti_fluesterer-2026'),
    'winti_fluesterer-2026'
  );
  assert.throws(() => validateProjectName('../bajour'), /Invalid project name/);
  assert.throws(
    () => validateProjectName('bajour;git push'),
    /Invalid project name/
  );
});

test('formats deploy tags with the project name and minute timestamp', () => {
  const { formatDeployTag } = loadDeployScript();

  assert.equal(
    formatDeployTag('bajour', new Date(2026, 5, 12, 13, 45, 30)),
    'deploy_bajour_202606121345'
  );
});

test('filters customer changelog entries in JavaScript instead of shelling out to egrep', () => {
  const { filterCustomerChangelog } = loadDeployScript();
  const changelog = [
    'abc123 update website navigation',
    'def456 fix unrelated docs',
    'fed321 improve bajour article page',
    '987654 refactor editor settings',
  ].join('\n');

  assert.equal(
    filterCustomerChangelog(changelog, 'bajour'),
    [
      'abc123 update website navigation',
      'fed321 improve bajour article page',
      '987654 refactor editor settings',
    ].join('\n')
  );
});
