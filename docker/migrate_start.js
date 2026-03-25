const { execFileSync } = require('child_process');

execFileSync('node', ['node_modules/.bin/prisma', 'migrate', 'deploy'], { stdio: 'inherit' });
execFileSync('node', ['dist/api/prisma/run-seed.js'], { stdio: 'inherit' });
