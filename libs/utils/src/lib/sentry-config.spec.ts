import type { Integration, SamplingContext } from '@sentry/core';
import {
  getBrowserDenyUrls,
  getBrowserIgnoreErrors,
  getServerConfig,
  withoutKeySpans,
} from './sentry-config';

const sample = (context: Partial<SamplingContext>) =>
  getServerConfig().tracesSampler({
    name: 'POST /v1',
    attributes: {},
    inheritOrSampleWith: (rate: number) => rate,
    ...context,
  } as SamplingContext);

describe('server tracing', () => {
  it.each([
    [
      'a Dragonfly command',
      {
        name: 'GET wepublish::nsv:settings',
        attributes: { 'db.system': 'redis' },
      },
    ],
    ['a Prisma query', { name: 'prisma:client:operation' }],
  ])('drops %s that runs outside any request', (_, context) => {
    expect(sample(context)).toBe(0);
  });

  it('traces requests at the configured rate', () => {
    expect(
      sample({ name: 'POST /v1', attributes: { 'http.method': 'POST' } })
    ).toBe(1);
  });

  it('never records Redis commands, whose spans carry cache keys', () => {
    const integrations = [
      { name: 'Http' },
      { name: 'Redis' },
      { name: 'Prisma' },
    ] as Integration[];

    expect(withoutKeySpans(integrations).map(({ name }) => name)).toEqual([
      'Http',
      'Prisma',
    ]);
  });
});

describe('browser deny urls', () => {
  const isDenied = (url: string) =>
    getBrowserDenyUrls().some(pattern => pattern.test(url));

  it.each([
    'https://media.online.bildwurf.ch/js/code.min.js',
    'https://www.bildwurf.ch/scripts/in_content/2026-03-25_bw_online_in_content_tsri_free_format.js',
    '/scripts/in_content/2026-03-25_bw_online_in_content_tsri_free_format.js',
  ])('drops errors thrown by the Bildwurf ad script at %s', url => {
    expect(isDenied(url)).toBe(true);
  });

  it.each([
    'https://wnti.ch/assets/main-a1b2c3.js',
    'https://tsri.ch/_next/static/chunks/pages/_app-a1b2c3.js',
    'https://wnti.ch/a/bildwurf-im-test',
  ])('keeps errors from first-party code at %s', url => {
    expect(isDenied(url)).toBe(false);
  });
});

describe('browser ignored errors', () => {
  const isIgnored = (message: string) =>
    getBrowserIgnoreErrors().some(pattern => pattern.test(message));

  it.each([
    'ReferenceError: jQuery is not defined',
    "ReferenceError: Can't find variable: jQuery",
    'ReferenceError: fbq is not defined',
    "ReferenceError: Can't find variable: fbq",
  ])('drops "%s" from third-party embeds', message => {
    expect(isIgnored(message)).toBe(true);
  });

  it.each([
    'ReferenceError: article is not defined',
    "ReferenceError: Can't find variable: jQueryPlugin",
    "TypeError: Cannot read properties of undefined (reading 'fbq')",
  ])('keeps "%s"', message => {
    expect(isIgnored(message)).toBe(false);
  });
});
