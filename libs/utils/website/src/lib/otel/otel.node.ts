import { metrics } from '@opentelemetry/api';
import { logs } from '@opentelemetry/api-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import {
  AggregationTemporalityPreference,
  OTLPMetricExporter,
} from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { RuntimeNodeInstrumentation } from '@opentelemetry/instrumentation-runtime-node';
import { UndiciInstrumentation } from '@opentelemetry/instrumentation-undici';
import {
  detectResources,
  envDetector,
  resourceFromAttributes,
} from '@opentelemetry/resources';
import {
  BatchLogRecordProcessor,
  LoggerProvider,
} from '@opentelemetry/sdk-logs';
import {
  MeterProvider,
  PeriodicExportingMetricReader,
} from '@opentelemetry/sdk-metrics';
import {
  BatchSpanProcessor,
  NodeTracerProvider,
} from '@opentelemetry/sdk-trace-node';
import { installConsoleBridge, type OtelConfig } from '@wepublish/utils/otel';
import { hostname } from 'node:os';

export type WebsiteOtel = { traces: boolean };

const guard = Symbol.for('wepublish.otel');

export function startWebsiteOtel(config: OtelConfig): WebsiteOtel {
  const store = globalThis as unknown as Record<
    symbol,
    WebsiteOtel | undefined
  >;
  const started = store[guard];

  if (started) {
    return started;
  }

  const resource = resourceFromAttributes({
    'service.name': config.serviceName,
    'service.instance.id': config.serviceInstanceId ?? hostname(),
    'service.version': config.serviceVersion,
    'deployment.environment.name': config.environment,
  }).merge(detectResources({ detectors: [envDetector] }));

  const meterProvider = new MeterProvider({
    resource,
    readers: [
      new PeriodicExportingMetricReader({
        exporter: new OTLPMetricExporter({
          temporalityPreference: AggregationTemporalityPreference.CUMULATIVE,
        }),
        exportIntervalMillis: config.metricExportIntervalMillis,
      }),
    ],
  });
  metrics.setGlobalMeterProvider(meterProvider);

  registerInstrumentations({
    meterProvider,
    instrumentations: [new RuntimeNodeInstrumentation()],
  });

  if (config.logsEnabled) {
    const loggerProvider = new LoggerProvider({
      resource,
      processors: [
        new BatchLogRecordProcessor({ exporter: new OTLPLogExporter() }),
      ],
    });
    logs.setGlobalLoggerProvider(loggerProvider);

    installConsoleBridge((severity, body) =>
      logs.getLogger('website').emit({
        ...severity,
        body,
        attributes: { 'log.source': 'console' },
      })
    );
  }

  const result: WebsiteOtel = { traces: config.websiteTraces };

  if (config.websiteTraces) {
    new NodeTracerProvider({
      resource,
      spanProcessors: [new BatchSpanProcessor(new OTLPTraceExporter())],
    }).register();

    registerInstrumentations({
      instrumentations: [new UndiciInstrumentation()],
    });
  }

  store[guard] = result;

  return result;
}
