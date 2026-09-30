const { exec } = require('child_process');
const { access } = require('fs/promises');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function getProjectRootDir() {
  const { stdout } = await execAsync("git rev-parse --show-toplevel");
  return stdout.trim();
}

async function createWorkTree(commitHash, dirPath) {
  try {
    await access(dirPath);
    await execAsync(`git -C "${dirPath}" checkout ${commitHash}`);
    console.log(`Worktree at ${dirPath} already exists, checked out commit: ${commitHash}`);
  } catch (err) {
    if (err.code === 'ENOENT') {
      await execAsync(`git worktree add "${dirPath}" ${commitHash}`);
      console.log(`Created new worktree at ${dirPath} for commit: ${commitHash}`);
    } else {
      throw err;
    }
  }
}

async function removeWorkTree(dirPath) {
  try {
    await access(dirPath);
    await execAsync(`git worktree remove ${dirPath} --force`);
    console.log(`deleted worktree at ${dirPath}`);
  } catch {
    console.log(`Worktree at ${dirPath} does not exist, skipping removal`);
  }
}

module.exports = { getProjectRootDir, createWorkTree, removeWorkTree };
