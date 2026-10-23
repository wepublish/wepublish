// @vitest-environment node
import type { OtelConfig } from '@wepublish/utils/otel';

const mocks = vi.hoisted(() => {
  const constructed = (name: string) =>
    vi.fn(function (this: Record<string, unknown>, ...args: unknown[]) {
      this['kind'] = name;
      this['args'] = args;
    });

  const loggerEmit = vi.fn();
  const tracerRegister = vi.fn();

  return {
    MeterProvider: constructed('MeterProvider'),
    PeriodicExportingMetricReader: constructed('PeriodicExportingMetricReader'),
    OTLPMetricExporter: constructed('OTLPMetricExporter'),
    LoggerProvider: constructed('LoggerProvider'),
    BatchLogRecordProcessor: constructed('BatchLogRecordProcessor'),
    OTLPLogExporter: constructed('OTLPLogExporter'),
    NodeTracerProvider: vi.fn(function (
      this: Record<string, unknown>,
      ...args: unknown[]
    ) {
      this['kind'] = 'NodeTracerProvider';
      this['args'] = args;
      this['register'] = tracerRegister;
    }),
    tracerRegister,
    BatchSpanProcessor: constructed('BatchSpanProcessor'),
    OTLPTraceExporter: constructed('OTLPTraceExporter'),
    RuntimeNodeInstrumentation: constructed('RuntimeNodeInstrumentation'),
    UndiciInstrumentation: constructed('UndiciInstrumentation'),
    registerInstrumentations: vi.fn(),
    resourceFromAttributes: vi.fn((attributes: Record<string, unknown>) => ({
      attributes,
      merge: (other: { attributes: Record<string, unknown> }) => ({
        attributes: { ...attributes, ...other.attributes },
      }),
    })),
    envDetector: { kind: 'envDetector' },
    detectResources: vi.fn(() => ({
      attributes: {
        'service.namespace': 'bajour',
        'deployment.environment.name': 'production',
      },
    })),
    setGlobalMeterProvider: vi.fn(),
    setGlobalTracerProvider: vi.fn(),
    setGlobalLoggerProvider: vi.fn(),
    getLogger: vi.fn(() => ({ emit: loggerEmit })),
    loggerEmit,
    installConsoleBridge: vi.fn(),
  };
});

vi.mock('@opentelemetry/sdk-metrics', () => ({
  MeterProvider: mocks.MeterProvider,
  PeriodicExportingMetricReader: mocks.PeriodicExportingMetricReader,
}));
vi.mock('@opentelemetry/exporter-metrics-otlp-http', () => ({
  OTLPMetricExporter: mocks.OTLPMetricExporter,
  AggregationTemporalityPreference: { DELTA: 0, CUMULATIVE: 1, LOWMEMORY: 2 },
}));
vi.mock('@opentelemetry/sdk-logs', () => ({
  LoggerProvider: mocks.LoggerProvider,
  BatchLogRecordProcessor: mocks.BatchLogRecordProcessor,
}));
vi.mock('@opentelemetry/exporter-logs-otlp-http', () => ({
  OTLPLogExporter: mocks.OTLPLogExporter,
}));
vi.mock('@opentelemetry/sdk-trace-node', () => ({
  NodeTracerProvider: mocks.NodeTracerProvider,
  BatchSpanProcessor: mocks.BatchSpanProcessor,
}));
vi.mock('@opentelemetry/exporter-trace-otlp-http', () => ({
  OTLPTraceExporter: mocks.OTLPTraceExporter,
}));
vi.mock('@opentelemetry/instrumentation-runtime-node', () => ({
  RuntimeNodeInstrumentation: mocks.RuntimeNodeInstrumentation,
}));
vi.mock('@opentelemetry/instrumentation-undici', () => ({
  UndiciInstrumentation: mocks.UndiciInstrumentation,
}));
vi.mock('@opentelemetry/instrumentation', () => ({
  registerInstrumentations: mocks.registerInstrumentations,
}));
vi.mock('@opentelemetry/resources', () => ({
  resourceFromAttributes: mocks.resourceFromAttributes,
  envDetector: mocks.envDetector,
  detectResources: mocks.detectResources,
}));
vi.mock('@opentelemetry/api', () => ({
  metrics: { setGlobalMeterProvider: mocks.setGlobalMeterProvider },
  trace: { setGlobalTracerProvider: mocks.setGlobalTracerProvider },
}));
vi.mock('@opentelemetry/api-logs', () => ({
  logs: {
    setGlobalLoggerProvider: mocks.setGlobalLoggerProvider,
    getLogger: mocks.getLogger,
  },
}));
vi.mock('@wepublish/utils/otel', () => ({
  installConsoleBridge: mocks.installConsoleBridge,
}));

const guard = Symbol.for('wepublish.otel');

const config = (overrides: Partial<OtelConfig> = {}): OtelConfig => ({
  serviceName: 'website-example',
  serviceInstanceId: 'web-1',
  serviceVersion: '1.2.3',
  environment: 'local',
  disabledInstrumentations: [],
  logsEnabled: true,
  websiteTraces: false,
  metricExportIntervalMillis: 15000,
  ...overrides,
});

const load = async () => {
  vi.resetModules();

  return import('./otel.node');
};

describe('startWebsiteOtel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete (globalThis as Record<symbol, unknown>)[guard];
  });

  afterAll(() => {
    delete (globalThis as Record<symbol, unknown>)[guard];
  });

  it('sets up metrics and logs without a tracer provider', async () => {
    const { startWebsiteOtel } = await load();

    expect(startWebsiteOtel(config())).toEqual({ traces: false });

    expect(mocks.resourceFromAttributes).toHaveBeenCalledWith({
      'service.name': 'website-example',
      'service.instance.id': 'web-1',
      'service.version': '1.2.3',
      'deployment.environment.name': 'local',
    });

    expect(mocks.MeterProvider).toHaveBeenCalledTimes(1);
    expect(mocks.MeterProvider.mock.calls[0][0]).toMatchObject({
      readers: [mocks.PeriodicExportingMetricReader.mock.instances[0]],
    });
    expect(mocks.setGlobalMeterProvider).toHaveBeenCalledWith(
      mocks.MeterProvider.mock.instances[0]
    );
    expect(mocks.registerInstrumentations).toHaveBeenCalledWith({
      meterProvider: mocks.MeterProvider.mock.instances[0],
      instrumentations: [mocks.RuntimeNodeInstrumentation.mock.instances[0]],
    });

    expect(mocks.LoggerProvider).toHaveBeenCalledTimes(1);
    expect(mocks.BatchLogRecordProcessor).toHaveBeenCalledWith({
      exporter: mocks.OTLPLogExporter.mock.instances[0],
    });
    expect(mocks.setGlobalLoggerProvider).toHaveBeenCalledWith(
      mocks.LoggerProvider.mock.instances[0]
    );
    expect(mocks.installConsoleBridge).toHaveBeenCalledTimes(1);

    expect(mocks.NodeTracerProvider).not.toHaveBeenCalled();
    expect(mocks.setGlobalTracerProvider).not.toHaveBeenCalled();
    expect(mocks.UndiciInstrumentation).not.toHaveBeenCalled();
  });

  it('pushes cumulative metrics over OTLP at the configured interval', async () => {
    const { startWebsiteOtel } = await load();
    startWebsiteOtel(config({ metricExportIntervalMillis: 5000 }));

    expect(mocks.OTLPMetricExporter).toHaveBeenCalledWith({
      temporalityPreference: 1,
    });
    expect(mocks.PeriodicExportingMetricReader).toHaveBeenCalledWith({
      exporter: mocks.OTLPMetricExporter.mock.instances[0],
      exportIntervalMillis: 5000,
    });
  });

  it('emits bridged console output through the website logger', async () => {
    const { startWebsiteOtel } = await load();
    startWebsiteOtel(config());

    const emit = mocks.installConsoleBridge.mock.calls[0][0];
    emit({ severityNumber: 13, severityText: 'WARN' }, 'careful');

    expect(mocks.getLogger).toHaveBeenCalledWith('website');
    expect(mocks.loggerEmit).toHaveBeenCalledWith({
      severityNumber: 13,
      severityText: 'WARN',
      body: 'careful',
      attributes: { 'log.source': 'console' },
    });
  });

  it('skips logs when they are disabled', async () => {
    const { startWebsiteOtel } = await load();
    startWebsiteOtel(config({ logsEnabled: false }));

    expect(mocks.LoggerProvider).not.toHaveBeenCalled();
    expect(mocks.setGlobalLoggerProvider).not.toHaveBeenCalled();
    expect(mocks.installConsoleBridge).not.toHaveBeenCalled();
    expect(mocks.setGlobalMeterProvider).toHaveBeenCalledTimes(1);
  });

  it('registers a tracer provider only when website traces are enabled', async () => {
    const { startWebsiteOtel } = await load();

    expect(startWebsiteOtel(config({ websiteTraces: true }))).toEqual({
      traces: true,
    });

    expect(mocks.NodeTracerProvider).toHaveBeenCalledTimes(1);
    expect(mocks.BatchSpanProcessor).toHaveBeenCalledWith(
      mocks.OTLPTraceExporter.mock.instances[0]
    );
    expect(mocks.tracerRegister).toHaveBeenCalledTimes(1);
    expect(mocks.registerInstrumentations).toHaveBeenCalledWith({
      instrumentations: [mocks.UndiciInstrumentation.mock.instances[0]],
    });
  });

  it('merges OTEL_RESOURCE_ATTRIBUTES over the configured resource', async () => {
    const { startWebsiteOtel } = await load();

    startWebsiteOtel(config());

    expect(mocks.detectResources).toHaveBeenCalledWith({
      detectors: [mocks.envDetector],
    });
    expect(mocks.MeterProvider.mock.calls[0][0]).toMatchObject({
      resource: {
        attributes: {
          'service.name': 'website-example',
          'service.namespace': 'bajour',
          'deployment.environment.name': 'production',
        },
      },
    });
    expect(mocks.LoggerProvider.mock.calls[0][0]).toMatchObject({
      resource: { attributes: { 'service.namespace': 'bajour' } },
    });
  });

  it('falls back to the hostname for the instance id', async () => {
    const { startWebsiteOtel } = await load();
    const { hostname } = await import('node:os');
    startWebsiteOtel(config({ serviceInstanceId: undefined }));

    expect(mocks.resourceFromAttributes).toHaveBeenCalledWith(
      expect.objectContaining({ 'service.instance.id': hostname() })
    );
  });

  it('is a no-op on the second call', async () => {
    const { startWebsiteOtel } = await load();
    const first = startWebsiteOtel(config({ websiteTraces: true }));
    vi.clearAllMocks();

    const { startWebsiteOtel: again } = await load();
    const second = again(config());

    expect(second).toBe(first);
    expect(mocks.MeterProvider).not.toHaveBeenCalled();
    expect(mocks.LoggerProvider).not.toHaveBeenCalled();
    expect(mocks.NodeTracerProvider).not.toHaveBeenCalled();
    expect(mocks.installConsoleBridge).not.toHaveBeenCalled();
  });
});
