import cors from 'cors';
import express from 'express';
import * as path from 'path';

import { handleRequest } from './src/main.server';

if (!process.env.API_URL)
  throw new Error('No API_URL specified in environment.');

const port = process.env['PORT'] || 3000;
const app = express();

const browserDist = path.join(process.cwd(), 'dist/apps/editor/browser');
const indexPath = path.join(browserDist, 'index.html');

app.use(cors());

app.get('/health', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ status: 'ok' });
});

app.get('/', (req, res) => {
  res.setHeader(
    'Cache-Control',
    'public, max-age=59, s-maxage=59, stale-while-revalidate=604800, stale-if-error=86400'
  );
  res.sendFile(indexPath);
});

app.use(
  express.static(browserDist, {
    setHeaders: (res, filePath) => {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    },
  })
);

app.get('*.*', express.static(browserDist, {}));

app.use('*', handleRequest(indexPath));

const server = app.listen(port, () => {
  // Server has started
});

server.on('error', console.error);
