import type { LogAttributes, logs } from '@opentelemetry/api-logs';
import { OtelSeverity, toOtelSeverity } from '@wepublish/utils/otel';

let logsApi: typeof logs | undefined;

const getLogsApi = () =>
  (logsApi ??= (
    require('@opentelemetry/api-logs') as typeof import('@opentelemetry/api-logs')
  ).logs);

const definedEntries = (attributes: Record<string, unknown> = {}) =>
  Object.fromEntries(
    Object.entries(attributes).filter(([, value]) => value !== undefined)
  );

export function emitOtelLog(
  source: string,
  level: string | OtelSeverity,
  body: string,
  attributes?: Record<string, unknown>
) {
  const severity = typeof level === 'object' ? level : toOtelSeverity(level);

  getLogsApi()
    .getLogger('wepublish')
    .emit({
      severityNumber: severity.severityNumber,
      severityText: severity.severityText,
      body,
      attributes: {
        'log.source': source,
        ...(definedEntries(attributes) as LogAttributes),
      },
    });
}
