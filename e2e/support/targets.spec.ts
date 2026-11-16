import { describe, expect, it } from 'vitest';
import {
  localDevServers,
  resolveTarget,
  subscribePlanOf,
  websiteApps,
} from './targets';

describe('subscribePlanOf', () => {
  it('takes the fixture plan of the example seed by default', () => {
    expect(subscribePlanOf('website-example')).toBe('test-abo-chf');
  });

  // Its subscribe page only offers the nw-* plans.
  it('takes a plan the Neue Wege subscribe page offers', () => {
    expect(subscribePlanOf('neuewege')).toBe('nw-jahresabo');
  });
});

describe('TanStack Start tenants', () => {
  it('are website apps like the Next ones', () => {
    expect(websiteApps()).toEqual(
      expect.arrayContaining(['website-example', 'gruppetto', 'tsri'])
    );
  });

  it('take their local port from the vite dev command', () => {
    expect(
      resolveTarget({ E2E_APP: 'website-example' } as NodeJS.ProcessEnv)
        .websiteUrl
    ).toBe('http://localhost:5200');
  });

  it('run the built nitro server', () => {
    const target = resolveTarget({
      E2E_APP: 'website-example',
    } as NodeJS.ProcessEnv);

    const server = localDevServers(target, {
      E2E_PROJECTS: 'website',
    } as NodeJS.ProcessEnv).find(({ name }) => name === 'website-example');

    expect(server?.command).toBe(
      'pnpm nx build website-example --skip-nx-cache && node --import dist/apps/website-example/.output/server/instrument.server.mjs dist/apps/website-example/.output/server/index.mjs'
    );
    expect(server?.env.PORT).toBe('5200');
  });

  it('run vite dev on the shifted port with --dev', () => {
    const target = resolveTarget({
      E2E_APP: 'website-example',
    } as NodeJS.ProcessEnv);

    const server = localDevServers(target, {
      E2E_PROJECTS: 'website',
      E2E_DEV: 'true',
    } as NodeJS.ProcessEnv).find(({ name }) => name === 'website-example');

    expect(server?.command).toBe(
      'cd apps/website-example && pnpm exec vite dev --port 5200'
    );
  });
});
