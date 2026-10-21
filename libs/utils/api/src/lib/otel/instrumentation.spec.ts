import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const start = vi.fn();
  const NodeSDK = vi.fn(function (this: { start: () => void }) {
    this.start = start;
  });
  const resourceFromAttributes = vi.fn(
    (attributes: Record<string, string>) => ({ attributes })
  );
  const names = [
    '@opentelemetry/instrumentation-http',
    '@opentelemetry/instrumentation-express',
    '@opentelemetry/instrumentation-nestjs-core',
    '@opentelemetry/instrumentation-graphql',
    '@opentelemetry/instrumentation-pg',
    '@opentelemetry/instrumentation-undici',
    '@opentelemetry/instrumentation-runtime-node',
  ];
  const factories = Object.fromEntries(
    names.map(name => [name, vi.fn(() => ({ instrumentationName: name }))])
  );
  const loadOtelModules = vi.fn(() => ({
    NodeSDK,
    resourceFromAttributes,
    instrumentationFactories: factories,
  }));
  const installConsoleBridge = vi.fn();
  const nestCommon = { loads: 0 };

  return {
    nestCommon,
    start,
    NodeSDK,
    resourceFromAttributes,
    names,
    factories,
    loadOtelModules,
    installConsoleBridge,
  };
});

vi.mock('./otel-modules', () => ({ loadOtelModules: mocks.loadOtelModules }));

vi.mock('@wepublish/utils/otel', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/utils/otel')>()),
  installConsoleBridge: mocks.installConsoleBridge,
}));

vi.mock('@nestjs/common', async importOriginal => {
  mocks.nestCommon.loads += 1;

  return importOriginal();
});

vi.mock('os', async importOriginal => ({
  ...(await importOriginal<typeof import('os')>()),
  hostname: () => 'api-host-1',
}));

const load = () => import('./instrumentation');

describe('otel instrumentation entry', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv('OTEL_METRIC_EXPORT_INTERVAL', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('does nothing when no endpoint is configured', async () => {
    vi.stubEnv('OTEL_EXPORTER_OTLP_ENDPOINT', '');
    const log = console.log;

    const { otelEnabled, otelLogsEnabled } = await load();

    expect(otelEnabled).toBe(false);
    expect(otelLogsEnabled).toBe(false);
    expect(mocks.loadOtelModules).not.toHaveBeenCalled();
    expect(mocks.NodeSDK).not.toHaveBeenCalled();
    for (const factory of Object.values(mocks.factories)) {
      expect(factory).not.toHaveBeenCalled();
    }
    expect(mocks.installConsoleBridge).not.toHaveBeenCalled();
    expect(console.log).toBe(log);
  });

  it('starts one sdk with every instrumentation when enabled', async () => {
    vi.stubEnv('OTEL_EXPORTER_OTLP_ENDPOINT', 'http://localhost:4318');
    vi.stubEnv('OTEL_SERVICE_NAME', 'wepublish-api');
    vi.stubEnv('OTEL_SERVICE_INSTANCE_ID', '');
    vi.stubEnv('APP_RELEASE_ID', '');
    vi.stubEnv('APP_ENVIRONMENT', 'development');

    const { otelEnabled, otelLogsEnabled } = await load();

    expect(otelEnabled).toBe(true);
    expect(otelLogsEnabled).toBe(true);
    expect(mocks.NodeSDK).toHaveBeenCalledTimes(1);
    expect(mocks.resourceFromAttributes).toHaveBeenCalledWith({
      'service.name': 'wepublish-api',
      'service.instance.id': 'api-host-1',
      'deployment.environment.name': 'development',
    });
    const [options] = mocks.NodeSDK.mock.calls[0] as unknown as [
      {
        resource: unknown;
        instrumentations: { instrumentationName: string }[];
      },
    ];
    expect(options.resource).toEqual({
      attributes: expect.objectContaining({ 'service.name': 'wepublish-api' }),
    });
    expect(
      options.instrumentations.map(
        ({ instrumentationName }) => instrumentationName
      )
    ).toEqual(mocks.names);
    expect(mocks.start).toHaveBeenCalledTimes(1);
    expect(mocks.installConsoleBridge).toHaveBeenCalledTimes(1);
  });

  it('never constructs disabled instrumentations', async () => {
    vi.stubEnv('OTEL_EXPORTER_OTLP_ENDPOINT', 'http://localhost:4318');
    vi.stubEnv(
      'OTEL_NODE_DISABLED_INSTRUMENTATIONS',
      '@opentelemetry/instrumentation-nestjs-core'
    );

    await load();

    expect(
      mocks.factories['@opentelemetry/instrumentation-nestjs-core']
    ).not.toHaveBeenCalled();
    const [options] = mocks.NodeSDK.mock.calls[0] as unknown as [
      { instrumentations: unknown[] },
    ];
    expect(options.instrumentations).toHaveLength(6);
  });

  it.each([
    ['unset', '', '15000'],
    ['set', '30000', '30000'],
    ['invalid', 'soon', '15000'],
  ])(
    'hands the sdk the metric export interval when it is %s',
    async (_, value, expected) => {
      vi.stubEnv('OTEL_EXPORTER_OTLP_ENDPOINT', 'http://localhost:4318');
      vi.stubEnv('OTEL_METRIC_EXPORT_INTERVAL', value);
      let seen: string | undefined;
      mocks.NodeSDK.mockImplementationOnce(function (this: {
        start: () => void;
      }) {
        seen = process.env['OTEL_METRIC_EXPORT_INTERVAL'];
        this.start = mocks.start;
      });

      await load();

      expect(seen).toBe(expected);
    }
  );

  it('leaves the metric export interval alone when the gate is off', async () => {
    vi.stubEnv('OTEL_EXPORTER_OTLP_ENDPOINT', '');
    vi.stubEnv('OTEL_METRIC_EXPORT_INTERVAL', '');

    await load();

    expect(process.env['OTEL_METRIC_EXPORT_INTERVAL']).toBe('');
  });

  it('leaves the console alone when logs are not exported', async () => {
    vi.stubEnv('OTEL_EXPORTER_OTLP_ENDPOINT', 'http://localhost:4318');
    vi.stubEnv('OTEL_LOGS_EXPORTER', 'none');

    await load();

    expect(mocks.start).toHaveBeenCalledTimes(1);
    expect(mocks.installConsoleBridge).not.toHaveBeenCalled();
  });

  it.each([
    ['off', ''],
    ['on', 'http://localhost:4318'],
  ])(
    'never loads @nestjs/common so Sentry can still patch it (gate %s)',
    async (_, endpoint) => {
      vi.stubEnv('OTEL_EXPORTER_OTLP_ENDPOINT', endpoint);

      await load();

      expect(mocks.nestCommon.loads).toBe(0);
    }
  );
});
