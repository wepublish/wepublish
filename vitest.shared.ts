import react from '@vitejs/plugin-react';
import swc from 'unplugin-swc';
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

// The `graphql` package ships both CJS (`main`) and ESM (`module`) builds.
// Node loads the CJS build for the externalized @nestjs/graphql (ESM) while
// vite resolves inlined source imports to the ESM build, yielding two class
// instances and failing `instanceof GraphQLScalarType` checks inside NestJS.
// Pin everything to the CJS build that node itself resolves.
const graphqlSingleInstance = [
  {
    find: /^graphql(\/index(\.js)?)?$/,
    replacement: join(workspaceRoot, 'node_modules/graphql/index.js'),
  },
];

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
  /**
   * NestJS projects need swc instead of esbuild so that decorator metadata
   * (`design:paramtypes`) is emitted for the DI container. Implies `react: false`.
   */
  nest?: boolean;
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
  nest = false,
  setupFiles = [],
  exclude = [],
  overrides,
}: VitestProjectOptions) => {
  const config = defineConfig({
    root: dir,
    cacheDir: join(workspaceRoot, 'node_modules/.vite', name),
    plugins:
      nest ?
        [
          swc.vite({
            jsc: {
              // es2021 so class fields are downleveled into the constructor
              // (after parameter property assignments), matching the tsc
              // output the production build uses. With native es2022 fields,
              // `field = this.injectedParam.x` initializers run before the
              // constructor body and crash.
              target: 'es2021',
              parser: { syntax: 'typescript', decorators: true },
              transform: {
                legacyDecorator: true,
                decoratorMetadata: true,
                // Match tsc semantics: field initializers may reference
                // constructor parameter properties (`= this.config.x`).
                useDefineForClassFields: false,
              },
              keepClassNames: true,
            },
            module: { type: 'es6' },
            sourceMaps: true,
          }),
        ]
      : withReact ?
        [
          react({
            jsxImportSource: '@emotion/react',
            babel: {
              plugins: [['@emotion/babel-plugin', { importMap: emotionImportMap }]],
            },
          }),
        ]
      : [],
    resolve: {
      alias: [
        ...graphqlSingleInstance,
        ...manualNodeModuleMocks,
        ...tsconfigPathAliases(),
      ],
    },
    test: {
      name,
      globals: true,
      environment,
      clearMocks: true,
      // Was a `--passWithNoTests` CLI flag on every project's test command;
      // it belongs to the config now that targets use the @nx/vitest executor.
      passWithNoTests: true,
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
        ...(nest ? [join(workspaceRoot, 'vitest.setup-nest.ts')] : []),
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
