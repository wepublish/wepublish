import { defineConfig } from 'vite';

// The express layer that serves the built browser bundle and injects the
// client settings script. Kept separate from vite.config.ts because the two
// builds share an output directory but nothing else: this one is a node
// bundle, so it gets no react plugin, no public dir and no process.env
// substitution (the server reads its environment at runtime).
export default defineConfig(({ mode }) => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/editor-server',
  publicDir: false,

  build: {
    // The image runs dist/apps/editor/main.js with the browser/ folder next to
    // it, so the entry has to land on that exact path.
    outDir: '../../dist/apps/editor',
    emptyOutDir: false,
    ssr: 'server.ts',
    target: 'node22',
    minify: false,
    sourcemap: mode === 'production' ? false : true,
    rollupOptions: {
      output: {
        format: 'cjs',
        entryFileNames: 'main.js',
      },
    },
  },
}));
