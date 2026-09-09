import react from '@vitejs/plugin-react';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { defineConfig, mergeConfig, type ViteUserConfig } from 'vitest/config';

const findWorkspaceRoot = (): string => {
  let dir = process.cwd();

  while (!existsSync(join(dir, 'nx.json'))) {
    const parent = dirname(dir);

    if (parent === dir) {
      throw new Error('Unable to locate the workspace root (no nx.json found).');
    }

    dir = parent;
  }

  return dir;
};

const workspaceRoot = findWorkspaceRoot();

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Mirrors the `paths` mapping of tsconfig.base.json so that `@wepublish/*`
// imports resolve to their source files instead of built output.
const tsconfigPathAliases = () => {
  const tsconfig = JSON.parse(
    readFileSync(join(workspaceRoot, 'tsconfig.base.json'), 'utf-8')
  );
  const paths: Record<string, string[]> = tsconfig.compilerOptions?.paths ?? {};

  return Object.entries(paths).map(([alias, [target]]) => {
    if (alias.includes('*')) {
      const [prefix, suffix = ''] = alias.split('*');

      return {
        find: new RegExp(
          `^${escapeRegExp(prefix)}(.*)${escapeRegExp(suffix)}$`
        ),
        replacement: join(workspaceRoot, target).replace('*', '$1'),
      };
    }

    return {
      find: new RegExp(`^${escapeRegExp(alias)}$`),
      replacement: join(workspaceRoot, target),
    };
  });
};

// Manual mocks that jest picked up automatically through the root `__mocks__`
// directory. Vitest has no such convention for node_modules, so they are aliased.
const manualNodeModuleMocks = [
  { find: /^react-player$/, replacement: join(workspaceRoot, '__mocks__/react-player.tsx') },
  { find: /^react-tweet$/, replacement: join(workspaceRoot, '__mocks__/react-tweet.tsx') },
];

const emotionImportMap = {
  '@mui/material': {
    styled: {
      canonicalImport: ['@emotion/styled', 'default'],
      styledBaseImport: ['@mui/material', 'styled'],
    },
  },
  '@mui/material/styles': {
    styled: {
      canonicalImport: ['@emotion/styled', 'default'],
      styledBaseImport: ['@mui/material/styles', 'styled'],
    },
  },
};

export type VitestProjectOptions = {
  /** Display name of the project, matches the Nx project name. */
  name: string;
  /** Absolute path of the project root, pass `__dirname`. */
  dir: string;
  /** Defaults to `happy-dom`, use `node` for backend/plain node projects. */
  environment?: 'happy-dom' | 'node';
  /** Whether the emotion/react JSX transform is needed. Defaults to `true`. */
  react?: boolean;
  /** Additional setup files, relative to the project root. */
  setupFiles?: string[];
  /** Additional test file globs to exclude, relative to the project root. */
  exclude?: string[];
  /** Escape hatch for project specific overrides. */
  overrides?: ViteUserConfig;
};

export const createVitestConfig = ({
  name,
  dir,
  environment = 'happy-dom',
  react: withReact = true,
  setupFiles = [],
  exclude = [],
  overrides,
}: VitestProjectOptions) => {
  const config = defineConfig({
    root: dir,
    cacheDir: join(workspaceRoot, 'node_modules/.vite', name),
    plugins: withReact
      ? [
          react({
            jsxImportSource: '@emotion/react',
            babel: {
              plugins: [['@emotion/babel-plugin', { importMap: emotionImportMap }]],
            },
          }),
        ]
      : [],
    resolve: {
      alias: [...manualNodeModuleMocks, ...tsconfigPathAliases()],
    },
    test: {
      name,
      globals: true,
      environment,
      clearMocks: true,
      // Jest ran every project in band, vitest runs test files in parallel
      // workers, so individual tests see more contention than the 5s default.
      testTimeout: 15_000,
      hookTimeout: 15_000,
      include: ['**/*.{spec,test}.{ts,tsx,js,jsx,mts,mjs,cts,cjs}'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/out-tsc/**',
        '**/.next/**',
        ...exclude,
      ],
      setupFiles: [
        join(workspaceRoot, 'vitest.setup-tests.ts'),
        ...setupFiles.map((file) => join(dir, file)),
      ],
      snapshotSerializers: [join(workspaceRoot, 'vitest.emotion-serializer.ts')],
      reporters: process.env['CI'] ? ['default', 'github-actions'] : ['default'],
      coverage: {
        provider: 'v8',
        reporter: ['html', 'text', 'lcov'],
        reportsDirectory: join(workspaceRoot, 'coverage', relative(workspaceRoot, dir)),
        include: ['src/**/*.{js,jsx,ts,tsx}'],
        exclude: ['**/*.stories.{js,jsx,ts,tsx}'],
      },
    },
  });

  return overrides ? mergeConfig(config, overrides) : config;
};
