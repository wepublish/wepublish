// @vitest-environment node
const mocks = vi.hoisted(() => ({
  init: vi.fn(),
  setTag: vi.fn(),
  captureRequestError: vi.fn(),
  openTelemetryIntegration: vi.fn(() => ({ name: 'OpenTelemetry' })),
  nodeProfilingIntegration: vi.fn(() => ({ name: 'ProfilingIntegration' })),
  forbidCachingErrors: vi.fn(),
  startWebsiteOtel: vi.fn(() => ({ traces: false })),
  getServerConfig: vi.fn(() => ({ dsn: 'https://dsn.example/1' })),
  setCommonTags: vi.fn(),
  withoutKeySpans: vi.fn((defaults: { name: string }[]) => defaults),
}));

vi.mock('@sentry/nextjs', () => ({
  init: mocks.init,
  setTag: mocks.setTag,
  captureRequestError: mocks.captureRequestError,
  openTelemetryIntegration: mocks.openTelemetryIntegration,
}));
vi.mock('@sentry/profiling-node', () => ({
  nodeProfilingIntegration: mocks.nodeProfilingIntegration,
}));
vi.mock('./error-no-store', () => ({
  forbidCachingErrors: mocks.forbidCachingErrors,
}));
vi.mock('../otel/otel.node', () => ({
  startWebsiteOtel: mocks.startWebsiteOtel,
}));
vi.mock('@wepublish/utils', () => ({
  getServerConfig: mocks.getServerConfig,
  setCommonTags: mocks.setCommonTags,
  withoutKeySpans: mocks.withoutKeySpans,
}));

type InitOptions = Record<string, unknown> & {
  integrations: (defaults: { name: string }[]) => { name: string }[];
};

const initOptions = () => mocks.init.mock.calls[0][0] as InitOptions;

const integrationNames = () =>
  initOptions()
    .integrations([{ name: 'Http' }])
    .map(integration => integration.name);

const runRegister = async () => {
  const { register } = await import('./instrumentation');
  await register();
};

describe('website server instrumentation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.stubEnv('OTEL_EXPORTER_OTLP_ENDPOINT', '');
    vi.stubEnv('OTEL_WEBSITE_TRACES', '');
    vi.stubEnv('OTEL_SDK_DISABLED', '');
    vi.stubEnv('APP_ENVIRONMENT', 'development');
    vi.stubEnv('NEXT_RUNTIME', 'nodejs');
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });

  it('initialises Sentry exactly as before when OTel is off', async () => {
    await runRegister();

    expect(mocks.startWebsiteOtel).not.toHaveBeenCalled();
    expect(mocks.forbidCachingErrors).toHaveBeenCalledTimes(1);
    expect(Object.keys(initOptions()).sort()).toEqual(
      [
        'dsn',
        'integrations',
        'profileLifecycle',
        'profileSessionSampleRate',
      ].sort()
    );
    expect(initOptions()).toMatchObject({
      dsn: 'https://dsn.example/1',
      profileLifecycle: 'trace',
      profileSessionSampleRate: 1.0,
    });
    expect(initOptions()).not.toHaveProperty('enableOpenTelemetrySetup');
    expect(integrationNames()).toEqual(['Http', 'ProfilingIntegration']);
    expect(mocks.setCommonTags).toHaveBeenCalledWith(
      expect.anything(),
      'nextjs-server'
    );
  });

  it('starts website OTel before Sentry without changing its options', async () => {
    vi.stubEnv('OTEL_EXPORTER_OTLP_ENDPOINT', 'http://localhost:4318');

    await runRegister();

    expect(mocks.startWebsiteOtel).toHaveBeenCalledTimes(1);
    expect(mocks.startWebsiteOtel).toHaveBeenCalledWith(
      expect.objectContaining({ websiteTraces: false })
    );
    expect(mocks.startWebsiteOtel.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.init.mock.invocationCallOrder[0]
    );
    expect(initOptions()).not.toHaveProperty('enableOpenTelemetrySetup');
    expect(integrationNames()).toEqual(['Http', 'ProfilingIntegration']);
  });

  it('hands span setup to OTel when website traces are on', async () => {
    vi.stubEnv('OTEL_EXPORTER_OTLP_ENDPOINT', 'http://localhost:4318');
    vi.stubEnv('OTEL_WEBSITE_TRACES', 'true');
    mocks.startWebsiteOtel.mockReturnValueOnce({ traces: true });

    await runRegister();

    expect(initOptions()).toHaveProperty('enableOpenTelemetrySetup', false);
    expect(integrationNames()).toEqual([
      'Http',
      'ProfilingIntegration',
      'OpenTelemetry',
    ]);
  });

  it('does nothing on the edge runtime', async () => {
    vi.stubEnv('NEXT_RUNTIME', 'edge');
    vi.stubEnv('OTEL_EXPORTER_OTLP_ENDPOINT', 'http://localhost:4318');

    await runRegister();

    expect(mocks.startWebsiteOtel).not.toHaveBeenCalled();
    expect(mocks.forbidCachingErrors).not.toHaveBeenCalled();
    expect(mocks.init).not.toHaveBeenCalled();
  });
});
