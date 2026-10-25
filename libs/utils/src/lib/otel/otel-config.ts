export type OtelConfig = {
  serviceName: string;
  serviceInstanceId?: string;
  serviceVersion?: string;
  environment?: string;
  disabledInstrumentations: string[];
  logsEnabled: boolean;
  websiteTraces: boolean;
  metricExportIntervalMillis: number;
};

export type OtelSeverity = {
  severityNumber: number;
  severityText: string;
};

const DEFAULT_METRIC_EXPORT_INTERVAL_MILLIS = 15000;

const metricExportInterval = (value?: string) => {
  const millis = Number(value);

  return millis > 0 ? millis : DEFAULT_METRIC_EXPORT_INTERVAL_MILLIS;
};

export function getOtelConfig(
  env: Record<string, string | undefined> = process.env,
  hostname?: string
): OtelConfig | undefined {
  if (!env['OTEL_EXPORTER_OTLP_ENDPOINT']?.trim()) {
    return undefined;
  }

  if (env['OTEL_SDK_DISABLED'] === 'true') {
    return undefined;
  }

  return {
    serviceName: env['OTEL_SERVICE_NAME'] || env['APP_NAME'] || 'wepublish',
    serviceInstanceId: env['OTEL_SERVICE_INSTANCE_ID'] || hostname,
    serviceVersion: env['APP_RELEASE_ID'],
    environment: env['APP_ENVIRONMENT'],
    disabledInstrumentations: (env['OTEL_NODE_DISABLED_INSTRUMENTATIONS'] ?? '')
      .split(',')
      .map(name => name.trim())
      .filter(Boolean),
    logsEnabled: env['OTEL_LOGS_EXPORTER'] !== 'none',
    websiteTraces: env['OTEL_WEBSITE_TRACES'] === 'true',
    metricExportIntervalMillis: metricExportInterval(
      env['OTEL_METRIC_EXPORT_INTERVAL']
    ),
  };
}

const TRACE: OtelSeverity = { severityNumber: 1, severityText: 'TRACE' };
const DEBUG: OtelSeverity = { severityNumber: 5, severityText: 'DEBUG' };
const INFO: OtelSeverity = { severityNumber: 9, severityText: 'INFO' };
const WARN: OtelSeverity = { severityNumber: 13, severityText: 'WARN' };
const ERROR: OtelSeverity = { severityNumber: 17, severityText: 'ERROR' };
const FATAL: OtelSeverity = { severityNumber: 21, severityText: 'FATAL' };

const severities: Record<string, OtelSeverity> = {
  verbose: TRACE,
  trace: TRACE,
  debug: DEBUG,
  log: INFO,
  info: INFO,
  warn: WARN,
  error: ERROR,
  fatal: FATAL,
};

export function toOtelSeverity(level: string): OtelSeverity {
  return { ...(severities[level] ?? INFO) };
}
