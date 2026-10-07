const fs = require('fs/promises');
const path = require('path');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

const shortcutsDisabled = () => process.env.VISUAL_REGRESSION_NO_SHORTCUTS === '1';

const LOCK_FILES = ['package.json', 'package-lock.json'];

async function git(cwd, args) {
  const { stdout } = await exec(`git ${args}`, { cwd, maxBuffer: 256 * 1024 * 1024 });
  return stdout;
}

async function resolveCommit(cwd, commitHash) {
  return (await git(cwd, `rev-parse --verify "${commitHash}^{commit}"`)).trim();
}

// npm writes its hidden lockfile at the end of a successful install
async function hasCompletedInstall(dir) {
  try {
    await fs.access(path.join(dir, 'node_modules/.package-lock.json'));
    return true;
  } catch {
    return false;
  }
}

// In CI the current commit is usually what the action already checked out and
// ran `npm ci` in, so it can run from there without a worktree or an install.
async function canRunInCheckout(root, commitHash) {
  if (shortcutsDisabled()) return false;
  try {
    const [head, commit] = await Promise.all([resolveCommit(root, 'HEAD'), resolveCommit(root, commitHash)]);
    let reason;
    if (head !== commit) reason = `checkout is at ${head}`;
    else if ((await git(root, 'status --porcelain')).trim()) reason = 'checkout has uncommitted changes';
    else if (!(await hasCompletedInstall(root))) reason = 'checkout has no completed npm install';
    if (reason) {
      console.log(`not running ${commitHash} from the checkout: ${reason}`);
      return false;
    }
    console.log(`running ${commitHash} from the checkout at ${root}`);
    return true;
  } catch (e) {
    console.warn(`could not check whether ${commitHash} can run from the checkout: ${e.message}`);
    return false;
  }
}

async function lockFilesMatchCheckout(root, commitHash) {
  for (const file of LOCK_FILES) {
    const [atCommit, inCheckout] = await Promise.all([
      git(root, `show "${commitHash}:${file}"`),
      fs.readFile(path.join(root, file), 'utf8'),
    ]);
    if (atCommit !== inCheckout) return false;
  }
  return hasCompletedInstall(root);
}

async function linkNodeModulesFromCheckout(root, dir) {
  const target = path.join(dir, 'node_modules');
  await fs.rm(target, { recursive: true, force: true });
  // hard links: seconds instead of minutes, and no extra disk space
  await exec(`cp -al "${path.join(root, 'node_modules')}" "${target}"`);
  await fs.rm(path.join(target, '.prisma'), { recursive: true, force: true });
  await exec('npx prisma generate', { cwd: dir });
}

async function installDependencies(root, dir, commitHash) {
  if (!shortcutsDisabled()) {
    let linking = false;
    try {
      if (await lockFilesMatchCheckout(root, commitHash)) {
        linking = true;
        await linkNodeModulesFromCheckout(root, dir);
        console.log(`reused the checkout's node_modules in ${dir}`);
        return;
      }
      console.log(`package.json/package-lock.json of ${commitHash} differ from the checkout`);
    } catch (e) {
      console.warn(`reusing node_modules in ${dir} failed, falling back to npm install: ${e.message}`);
      if (linking) await fs.rm(path.join(dir, 'node_modules'), { recursive: true, force: true });
    }
  }
  console.log(`run npm install in ${dir}`);
  await exec('npm install', { cwd: dir });
}

module.exports = { canRunInCheckout, installDependencies };
