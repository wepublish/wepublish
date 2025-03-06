const {exec} = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const chalk = require("chalk");

if (!process.argv[2]) {
  console.error('Error: Project name is required.');
  process.exit(1);
}

const projectName = process.argv[2];

const rootPath = path.dirname(require.main.filename);
const configPath = path.resolve(rootPath, '../apps', projectName, 'deployment.config.json');

if (!fs.existsSync(configPath)) {
  console.error(`Error: Given project < ${projectName} > does not exist or does not have a config <deployment.config.json>!`);
  process.exit(1);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askConfirmation() {
  return new Promise(async (resolve) => {
    const changelogCommand = `git log --color=always --graph --decorate --pretty=format:'%C(yellow)%h%C(reset) %s %C(cyan)%an%C(reset)' --abbrev-commit $(git describe --abbrev=0 --tags --match 'deploy_${projectName}_*' )..HEAD`
    let changelog = await execCommand(changelogCommand)
    changelog = changelog.replace(/#([0-9]+)/g, (text, number) => `\x1b]8;;https://github.com/wepublish/wepublish/pull/${number}\x1b\\${text}\x1b]8;;\x1b\\`)
    const filterCommand = `echo "${changelog}" |egrep "core|${projectName}"`
    const changelogFiltered = await execCommand(filterCommand)
    rl.write(`${chalk.underline("All changes you are about to deploy")}:\n\n${changelog}\n\n`)
    rl.write(`${chalk.underline("Changes impacting customer you are about to deploy")}:\n\n${changelogFiltered}\n\n`)
    rl.question(`Are you sure you want to deploy this commit to ${chalk.bold(projectName)} production? To confirm, write the project name: `, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

const date = new Date();
const timestamp = date.getFullYear().toString() +
  (date.getMonth() + 1).toString().padStart(2, '0') +
  date.getDate().toString().padStart(2, '0') +
  date.getHours().toString().padStart(2, '0') +
  date.getMinutes().toString().padStart(2, '0');

const tagName = `deploy_${projectName}_${timestamp}`;

const commands = [
  `git tag ${tagName}`,
  `git push origin ${tagName}`
];

async function checkUncommittedChanges() {
  return new Promise((resolve, reject) => {
    exec('git status --porcelain', (error, stdout, stderr) => {
      if (error) {
        reject(`Error checking Git status: ${stderr}`);
      } else {
        resolve(stdout);
      }
    });
  });
}

function execCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(`Error executing command: ${command}\n${stderr}`);
      } else {
        resolve(stdout);
      }
    });
  });
}

async function deploy() {
  try {

    /**
    const status = await checkUncommittedChanges();
    if (status.trim() !== '') {
      console.error('Error: There are uncommitted changes in the repository. Please commit your changes before deploying.');
      process.exit(1);
    }**/

    const confirmation = await askConfirmation();
    if (confirmation !== projectName) {
      console.error('Error: Project name does not match. Deployment aborted.');
      process.exit(1);
    }
    for (const command of commands) {
      const result = await execCommand(command);
      console.log(result);
    }
    console.log(`Successfully deployed with tag: ${tagName}`);
  } catch (err) {
    console.error('Error during deployment:', err);
  }
}

deploy();
