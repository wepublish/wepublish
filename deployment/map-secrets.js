const fs = require('fs');
const path = require('path');

const mode = process.argv[2];
const execArgs = process.argv.slice(3);

function findFiles(dir, test) {
  const results = [];
  try {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...findFiles(full, test));
      } else if (entry.isFile()) {
        try {
          const content = fs.readFileSync(full, 'utf8');
          if (test(content)) results.push({ path: full, content });
        } catch {}
      }
    }
  } catch {}
  return results;
}

function replaceInFiles(searchDir, search, replace) {
  const files = findFiles(searchDir, (c) => c.includes(search));
  for (const file of files) {
    fs.writeFileSync(file.path, file.content.split(search).join(replace));
  }
  return files.length;
}

if (mode === 'clean') {
  const listPath = path.join(process.cwd(), 'secrets.list');
  if (fs.existsSync(listPath)) {
    const lines = fs.readFileSync(listPath, 'utf8').trim().split('\n').filter(Boolean);
    for (const line of lines) {
      const [name, value] = line.split('=');
      console.log(`Removed secret variable ${line}`);
      replaceInFiles('/wepublish/dist', `"${value}"`, `"@@@${name}@@@"`);
    }
    fs.unlinkSync(listPath);
  }
  process.exit(0);
}

if (mode === 'restore') {
  const listPath = path.join(process.cwd(), 'secrets_name.list');
  if (fs.existsSync(listPath)) {
    const names = fs.readFileSync(listPath, 'utf8').trim().split('\n').filter(Boolean);
    for (const name of names) {
      const value = process.env[name];
      if (!value) {
        console.error(`Secret env ${name} not set!`);
        process.exit(99);
      }
      console.log(`Inserted secret variable ${name}`);
      replaceInFiles('/wepublish', `"@@@${name}@@@"`, `"${value}"`);
    }
  }
  if (execArgs.length > 0) {
    let cmd, args;
    if (execArgs[0] === '--start') {
      const config = JSON.parse(fs.readFileSync('/wepublish/startup-config.json', 'utf8'));
      cmd = 'node';
      args = [config.serverPath];
    } else {
      cmd = execArgs[0];
      args = execArgs.slice(1);
    }
    const child = require('child_process').spawn(cmd, args, { stdio: 'inherit' });
    child.on('exit', (code) => process.exit(code || 0));
    return;
  }
  process.exit(0);
}

process.exit(99);
