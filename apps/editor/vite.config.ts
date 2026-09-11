import react from '@vitejs/plugin-react';
import { join } from 'node:path';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(({ mode }) => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/editor',
  publicDir: 'public',

  server: {
    port: 3000,
    host: '0.0.0.0',
    fs: {
      allow: [join(__dirname, '../..')],
    },
  },

  plugins: [
    react({
      jsxImportSource: '@emotion/react',
      babel: {
        plugins: ['@emotion/babel-plugin'],
      },
    }),
    tsconfigPaths({
      root: join(__dirname, '../..'),
      projects: ['tsconfig.base.json'],
    }),
  ],

  define: {
    'process.env.WEP_ONE_URL': JSON.stringify(process.env.WEP_ONE_URL || ''),
    'process.env.API_URL': JSON.stringify(process.env.API_URL || ''),
    'process.env.APP_NAME': JSON.stringify(process.env.APP_NAME || ''),
    'process.env.APP_RELEASE_ID': JSON.stringify(
      process.env.APP_RELEASE_ID || ''
    ),
    'process.env.NODE_ENV': JSON.stringify(mode),
    'process.env': '{}',
  },

  build: {
    outDir: '../../dist/apps/editor/browser',
    emptyOutDir: true,
    // Keeps bundle output clear of the favicons served from public/assets.
    assetsDir: 'static',
    sourcemap: mode !== 'production',
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
}));
