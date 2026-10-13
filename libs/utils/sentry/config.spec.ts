import type { Integration, SamplingContext } from '@sentry/core';
import { getServerConfig, withoutKeySpans } from './config';

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
