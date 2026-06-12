const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const chalk = require('chalk');

const repositoryRoot = path.resolve(__dirname, '..');

function validateProjectName(projectName) {
  if (
    typeof projectName !== 'string' ||
    !/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(projectName)
  ) {
    throw new Error('Invalid project name.');
  }

  return projectName;
}

function getDeploymentConfigPath(projectName) {
  return path.resolve(
    repositoryRoot,
    'apps',
    projectName,
    'deployment.config.json'
  );
}

function formatDeployTag(projectName, date = new Date()) {
  const timestamp =
    date.getFullYear().toString() +
    (date.getMonth() + 1).toString().padStart(2, '0') +
    date.getDate().toString().padStart(2, '0') +
    date.getHours().toString().padStart(2, '0') +
    date.getMinutes().toString().padStart(2, '0');

  return `deploy_${projectName}_${timestamp}`;
}

function execGit(args, rejectRCNonZero = true) {
  return new Promise((resolve, reject) => {
    execFile('git', args, { cwd: repositoryRoot }, (error, stdout, stderr) => {
      if (error) {
        if (rejectRCNonZero) {
          reject(
            `Error executing git ${args.join(' ')}\n${stderr || error.message}`
          );
        } else {
          resolve(stdout);
        }
      } else {
        resolve(stdout);
      }
    });
  });
}

async function checkUncommittedChanges() {
  return execGit(['status', '--porcelain']);
}

async function getLastDeployTag(projectName) {
  const tags = await execGit([
    'tag',
    '-l',
    `deploy_${projectName}_*`,
    '--sort=version:refname',
  ]);

  return tags.trim().split('\n').filter(Boolean).pop();
}

function filterCustomerChangelog(changelog, projectName) {
  const keywords = [
    'core',
    'website',
    'editor',
    'api',
    projectName.toLowerCase(),
  ];

  return changelog
    .split(/\r?\n/)
    .filter(line => {
      const normalizedLine = line.toLowerCase();
      return keywords.some(keyword => normalizedLine.includes(keyword));
    })
    .join('\n');
}

function linkPullRequests(changelog) {
  return changelog.replace(
    /#([0-9]+)/g,
    (text, number) =>
      `\x1b]8;;https://github.com/wepublish/wepublish/pull/${number}\x1b\\${text}\x1b]8;;\x1b\\`
  );
}

async function askConfirmation(projectName) {
  await execGit(['fetch', '--tags'], false);

  const lastDeployTag = await getLastDeployTag(projectName);
  const changelogArgs = [
    'log',
    '--color=always',
    '--graph',
    '--decorate',
    '--pretty=format:%C(yellow)%h%C(reset) %s %C(cyan)%an%C(reset)',
    '--abbrev-commit',
    lastDeployTag ? `${lastDeployTag}..HEAD` : 'HEAD',
  ];
  const changelog = linkPullRequests(await execGit(changelogArgs));
  const changelogFiltered = filterCustomerChangelog(changelog, projectName);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    rl.write(
      `${chalk.underline('All changes you are about to deploy')}:\n\n${changelog}\n\n`
    );
    rl.write(
      `${chalk.underline(
        'Changes impacting customer you are about to deploy'
      )}:\n\n${changelogFiltered}\n\n`
    );
    rl.question(
      `Are you sure you want to deploy this commit to ${chalk.bold(
        projectName
      )} production? To confirm, write the project name: `,
      answer => {
        rl.close();
        resolve(answer);
      }
    );
  });
}

async function deploy(projectName) {
  const status = await checkUncommittedChanges();
  if (status.trim() !== '') {
    throw new Error(
      'There are uncommitted changes in the repository. Please commit your changes before deploying.'
    );
  }

  const confirmation = await askConfirmation(projectName);
  if (confirmation !== projectName) {
    throw new Error('Project name does not match. Deployment aborted.');
  }

  const tagName = formatDeployTag(projectName);
  for (const args of [
    ['tag', tagName],
    ['push', 'origin', tagName],
  ]) {
    const result = await execGit(args);
    console.log(result);
  }

  console.log(`Successfully deployed with tag: ${tagName}`);
}

async function main(argv = process.argv) {
  const requestedProjectName = argv[2];

  if (!requestedProjectName) {
    console.error('Error: Project name is required.');
    return 1;
  }

  let projectName;
  try {
    projectName = validateProjectName(requestedProjectName);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return 1;
  }

  const configPath = getDeploymentConfigPath(projectName);
  if (!fs.existsSync(configPath)) {
    console.error(
      `Error: Given project < ${projectName} > does not exist or does not have a config <deployment.config.json>!`
    );
    return 1;
  }

  try {
    await deploy(projectName);
    return 0;
  } catch (error) {
    console.error('Error during deployment:', error);
    return 1;
  }
}

if (require.main === module) {
  main().then(exitCode => {
    process.exit(exitCode);
  });
}

module.exports = {
  filterCustomerChangelog,
  formatDeployTag,
  validateProjectName,
};
