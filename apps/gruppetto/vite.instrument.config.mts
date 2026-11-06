import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

const projectRoot = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = join(projectRoot, '../..');

/**
 * Builds the `--import` preload that initialises Sentry before the server
 * bundle loads. See `src/instrument.server.ts` for why it has to be separate.
 *
 * Emitted next to `index.mjs` so the runtime flag can point at a path that
 * exists in the image without the Dockerfile copying anything around.
 *
 * `@sentry/*` stays external here for the same reason `vite.config.mts` makes
 * it external: both this file and the server bundle must resolve the one copy
 * nitro traces into `.output/server/node_modules`, or they get separate
 * clients and this init configures the wrong one.
 */
export default defineConfig({
  root: projectRoot,
  plugins: [
    tsconfigPaths({
      root: workspaceRoot,
      projects: [join(workspaceRoot, 'tsconfig.base.json')],
    }),
  ],
  build: {
    ssr: true,
    emptyOutDir: false,
    outDir: join(workspaceRoot, 'dist/apps/gruppetto/.output/server'),
    rollupOptions: {
      input: join(projectRoot, 'src/instrument.server.ts'),
      external: [/^@sentry\//, /^node:/],
      output: { entryFileNames: 'instrument.server.mjs', format: 'esm' },
    },
  },
});
