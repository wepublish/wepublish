import cors from 'cors';
import express, { Express } from 'express';

import { handleRequest } from './main.server';

export function createApp(browserDist: string, indexPath: string): Express {
  const app = express();

  app.use(cors());

  app.get('/health', (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ status: 'ok' });
  });

  // Built assets are content hashed, so anything that exists on disk can be
  // cached forever. `index: false` keeps index.html out of here; it is rendered
  // by the fallback below, which injects the client settings.
  app.use(
    express.static(browserDist, {
      index: false,
      setHeaders: res => {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      },
    })
  );

  // Everything else is a client side route. Express 5 has no wildcard path
  // that matches a bare `*`, and an unmounted `use` already matches every URL.
  app.use(handleRequest(indexPath));

  return app;
}
