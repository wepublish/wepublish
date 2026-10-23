// @vitest-environment node
import { readFileSync } from 'node:fs';
import Module from 'node:module';
import { hostname } from 'node:os';
import { join } from 'node:path';

const mocks = vi.hoisted(() => {
  const start = vi.fn();

  return {
    start,
    NodeSDK: vi.fn(function (this: Record<string, unknown>, options: unknown) {
      this['options'] = options;
      this['start'] = start;
    }),
    HttpInstrumentation: vi.fn(function (
      this: Record<string, unknown>,
      options: unknown
    ) {
      this['kind'] = 'http';
      this['options'] = options;
    }),
    ExpressInstrumentation: vi.fn(function (this: Record<string, unknown>) {
      this['kind'] = 'express';
    }),
    RuntimeNodeInstrumentation: vi.fn(function (this: Record<string, unknown>) {
      this['kind'] = 'runtime-node';
    }),
    resourceFromAttributes: vi.fn((attributes: Record<string, unknown>) => ({
      attributes,
    })),
  };
});

const loadEditorOtelModules = vi.hoisted(() => vi.fn());

beforeEach(() => {
  loadEditorOtelModules.mockImplementation(() => ({
    NodeSDK: mocks.NodeSDK,
    HttpInstrumentation: mocks.HttpInstrumentation,
    ExpressInstrumentation: mocks.ExpressInstrumentation,
    RuntimeNodeInstrumentation: mocks.RuntimeNodeInstrumentation,
    resourceFromAttributes: mocks.resourceFromAttributes,
  }));
});

vi.mock('./otel-modules', () => ({
  loadEditorOtelModules,
}));

const load = async (env: Record<string, string>) => {
  vi.resetModules();
  vi.unstubAllEnvs();
  vi.stubEnv('OTEL_EXPORTER_OTLP_ENDPOINT', '');
  vi.stubEnv('OTEL_SDK_DISABLED', '');
  vi.stubEnv('OTEL_SERVICE_NAME', '');
  vi.stubEnv('OTEL_SERVICE_INSTANCE_ID', '');
  vi.stubEnv('OTEL_METRIC_EXPORT_INTERVAL', '');

  for (const [key, value] of Object.entries(env)) {
    vi.stubEnv(key, value);
  }

  return import('./otel');
};

describe('editor server OTel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });

  it.each([
    ['unset', {}],
    ['whitespace', { OTEL_EXPORTER_OTLP_ENDPOINT: '  ' }],
    [
      'disabled',
      {
        OTEL_EXPORTER_OTLP_ENDPOINT: 'http://localhost:4318',
        OTEL_SDK_DISABLED: 'true',
      },
    ],
  ])('constructs nothing when the gate is %s', async (_, env) => {
    const { startEditorOtel } = await load(env);

    expect(startEditorOtel(process.env)).toBeUndefined();
    expect(loadEditorOtelModules).not.toHaveBeenCalled();
    expect(mocks.NodeSDK).not.toHaveBeenCalled();
    expect(mocks.HttpInstrumentation).not.toHaveBeenCalled();
    expect(mocks.ExpressInstrumentation).not.toHaveBeenCalled();
    expect(mocks.RuntimeNodeInstrumentation).not.toHaveBeenCalled();
  });

  it('starts the SDK once on import when the gate is on', async () => {
    await load({ OTEL_EXPORTER_OTLP_ENDPOINT: 'http://localhost:4318' });

    expect(mocks.NodeSDK).toHaveBeenCalledTimes(1);
    expect(mocks.start).toHaveBeenCalledTimes(1);
    expect(mocks.resourceFromAttributes).toHaveBeenCalledWith({
      'service.name': 'wepublish-editor',
      'service.instance.id': hostname(),
    });

    const options = mocks.NodeSDK.mock.calls[0][0] as {
      instrumentations: { kind: string }[];
    };

    expect(options.instrumentations.map(({ kind }) => kind)).toEqual([
      'http',
      'express',
      'runtime-node',
    ]);
  });

  it('re-requires http and express after start so preloaded copies get patched', async () => {
    const requireSpy = vi.spyOn(Module.prototype, 'require');

    try {
      await load({ OTEL_EXPORTER_OTLP_ENDPOINT: 'http://localhost:4318' });

      const requiredAfterStart = requireSpy.mock.calls
        .filter(
          (_, index) =>
            requireSpy.mock.invocationCallOrder[index] >
            mocks.start.mock.invocationCallOrder[0]
        )
        .map(([id]) => id);

      expect(requiredAfterStart).toEqual(
        expect.arrayContaining(['http', 'express'])
      );
    } finally {
      requireSpy.mockRestore();
    }
  });

  it('requires nothing extra when the gate is off', async () => {
    const requireSpy = vi.spyOn(Module.prototype, 'require');

    try {
      await load({});

      const required = requireSpy.mock.calls.map(([id]) => id);

      expect(required).not.toContain('express');
      expect(required.filter(id => id.startsWith('@opentelemetry'))).toEqual(
        []
      );
    } finally {
      requireSpy.mockRestore();
    }
  });

  it.each([
    ['unset', '', '15000'],
    ['set', '30000', '30000'],
    ['invalid', 'soon', '15000'],
  ])(
    'hands the sdk the metric export interval when it is %s',
    async (_, value, expected) => {
      let seen: string | undefined;
      mocks.NodeSDK.mockImplementationOnce(function (
        this: Record<string, unknown>
      ) {
        seen = process.env['OTEL_METRIC_EXPORT_INTERVAL'];
        this['start'] = mocks.start;
      });

      await load({
        OTEL_EXPORTER_OTLP_ENDPOINT: 'http://localhost:4318',
        OTEL_METRIC_EXPORT_INTERVAL: value,
      });

      expect(seen).toBe(expected);
    }
  );

  it('leaves the metric export interval alone when the gate is off', async () => {
    await load({ OTEL_METRIC_EXPORT_INTERVAL: '' });

    expect(process.env['OTEL_METRIC_EXPORT_INTERVAL']).toBe('');
  });

  it('uses the configured service name and instance id', async () => {
    await load({
      OTEL_EXPORTER_OTLP_ENDPOINT: 'http://localhost:4318',
      OTEL_SERVICE_NAME: 'editor-local',
      OTEL_SERVICE_INSTANCE_ID: 'editor-1',
    });

    expect(mocks.resourceFromAttributes).toHaveBeenCalledWith({
      'service.name': 'editor-local',
      'service.instance.id': 'editor-1',
    });
  });

  it('ignores health checks in the http instrumentation', async () => {
    await load({ OTEL_EXPORTER_OTLP_ENDPOINT: 'http://localhost:4318' });

    const { ignoreIncomingRequestHook } = mocks.HttpInstrumentation.mock
      .calls[0][0] as {
      ignoreIncomingRequestHook: (request: { url?: string }) => boolean;
    };

    expect(ignoreIncomingRequestHook({ url: '/health' })).toBe(true);
    expect(ignoreIncomingRequestHook({ url: '/' })).toBe(false);
    expect(ignoreIncomingRequestHook({})).toBe(false);
  });

  it.each(['main.tsx', 'main.server.ts'])('keeps OTel out of %s', fileName => {
    const source = readFileSync(join(__dirname, fileName), 'utf-8');

    expect(source).not.toContain('@opentelemetry');
    expect(source.toLowerCase()).not.toContain('otel');
  });

  it('imports only types from @opentelemetry so the gate decides what loads', () => {
    const source = readFileSync(join(__dirname, 'otel.ts'), 'utf-8');
    const valueImports = source
      .split('\n')
      .filter(line => line.includes('@opentelemetry'))
      .filter(line => !line.startsWith('import type '));

    expect(valueImports).toEqual([]);
  });

  it('loads OTel first in the server entry', () => {
    const source = readFileSync(join(__dirname, '..', 'server.ts'), 'utf-8');

    expect(source.split('\n')[0]).toBe("import './src/otel';");
  });
});
