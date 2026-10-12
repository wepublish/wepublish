import * as path from 'path';

import { createApp } from './src/server-app';

if (!process.env.API_URL) {
  throw new Error('No API_URL specified in environment.');
}

const port = process.env['PORT'] || 3000;

const browserDist = path.join(process.cwd(), 'dist/apps/editor/browser');
const indexPath = path.join(browserDist, 'index.html');

const server = createApp(browserDist, indexPath).listen(port, () => {
  // Server has started
});

server.on('error', console.error);
