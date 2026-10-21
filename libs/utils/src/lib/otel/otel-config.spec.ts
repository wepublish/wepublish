import { getOtelConfig, toOtelSeverity } from './otel-config';

describe('getOtelConfig', () => {
  it.each([
    ['unset', {}],
    ['empty', { OTEL_EXPORTER_OTLP_ENDPOINT: '' }],
    ['whitespace only', { OTEL_EXPORTER_OTLP_ENDPOINT: '   ' }],
    [
      'disabled by OTEL_SDK_DISABLED',
      {
        OTEL_EXPORTER_OTLP_ENDPOINT: 'http://localhost:4318',
        OTEL_SDK_DISABLED: 'true',
      },
    ],
  ])('is off when the endpoint is %s', (_, env) => {
    expect(getOtelConfig(env, 'host-1')).toBeUndefined();
  });

  it('falls back to defaults when only the endpoint is set', () => {
    expect(
      getOtelConfig(
        { OTEL_EXPORTER_OTLP_ENDPOINT: 'http://localhost:4318' },
        'host-1'
      )
    ).toEqual({
      serviceName: 'wepublish',
      serviceInstanceId: 'host-1',
      serviceVersion: undefined,
      environment: undefined,
      disabledInstrumentations: [],
      logsEnabled: true,
      websiteTraces: false,
      metricExportIntervalMillis: 15000,
    });
  });

  it.each([
    ['unset', undefined, 15000],
    ['empty', '', 15000],
    ['a positive number', '30000', 30000],
    ['zero', '0', 15000],
    ['negative', '-5', 15000],
    ['not a number', 'soon', 15000],
  ])(
    'exports metrics every interval when OTEL_METRIC_EXPORT_INTERVAL is %s',
    (_, value, expected) => {
      expect(
        getOtelConfig({
          OTEL_EXPORTER_OTLP_ENDPOINT: 'http://localhost:4318',
          OTEL_METRIC_EXPORT_INTERVAL: value,
        })?.metricExportIntervalMillis
      ).toBe(expected);
    }
  );

  it('uses APP_NAME when OTEL_SERVICE_NAME is missing', () => {
    expect(
      getOtelConfig({
        OTEL_EXPORTER_OTLP_ENDPOINT: 'http://localhost:4318',
        APP_NAME: 'bajour',
      })?.serviceName
    ).toBe('bajour');
  });

  it('reads every field from the environment', () => {
    expect(
      getOtelConfig(
        {
          OTEL_EXPORTER_OTLP_ENDPOINT: 'http://localhost:4318',
          OTEL_SERVICE_NAME: 'wepublish-api',
          APP_NAME: 'bajour',
          OTEL_SERVICE_INSTANCE_ID: 'api-2',
          APP_RELEASE_ID: 'abc123',
          APP_ENVIRONMENT: 'development',
          OTEL_NODE_DISABLED_INSTRUMENTATIONS:
            ' @opentelemetry/instrumentation-pg , ,@opentelemetry/instrumentation-undici',
          OTEL_LOGS_EXPORTER: 'none',
          OTEL_WEBSITE_TRACES: 'true',
          OTEL_METRIC_EXPORT_INTERVAL: '5000',
        },
        'host-1'
      )
    ).toEqual({
      serviceName: 'wepublish-api',
      serviceInstanceId: 'api-2',
      serviceVersion: 'abc123',
      environment: 'development',
      disabledInstrumentations: [
        '@opentelemetry/instrumentation-pg',
        '@opentelemetry/instrumentation-undici',
      ],
      logsEnabled: false,
      websiteTraces: true,
      metricExportIntervalMillis: 5000,
    });
  });
});

describe('toOtelSeverity', () => {
  it.each([
    ['verbose', 1, 'TRACE'],
    ['trace', 1, 'TRACE'],
    ['10', 9, 'INFO'],
    ['debug', 5, 'DEBUG'],
    ['log', 9, 'INFO'],
    ['info', 9, 'INFO'],
    ['warn', 13, 'WARN'],
    ['error', 17, 'ERROR'],
    ['fatal', 21, 'FATAL'],
    ['something', 9, 'INFO'],
  ])('maps %s to %s %s', (level, severityNumber, severityText) => {
    expect(toOtelSeverity(level)).toEqual({ severityNumber, severityText });
  });
});
