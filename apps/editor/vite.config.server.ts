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
    // `@yao-pkg/pkg` snapshots dist/apps/editor/main.js, so the entry has to
    // land on that exact path next to the browser/ folder.
    outDir: '../../dist/apps/editor',
    emptyOutDir: false,
    ssr: 'server.ts',
    target: 'node22',
    // pkg only understands CommonJS with statically analyzable requires.
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
