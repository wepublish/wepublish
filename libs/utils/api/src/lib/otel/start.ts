import { installConsoleBridge, OtelConfig } from '@wepublish/utils/otel';

import { emitOtelLog } from './log-bridge';
import { loadOtelModules } from './otel-modules';

export function startNodeOtel(config: OtelConfig) {
  const { NodeSDK, resourceFromAttributes, instrumentationFactories } =
    loadOtelModules();

  const instrumentations = Object.entries(instrumentationFactories)
    .filter(([name]) => !config.disabledInstrumentations.includes(name))
    .map(([, factory]) => factory());

  const attributes = Object.fromEntries(
    Object.entries({
      'service.name': config.serviceName,
      'service.instance.id': config.serviceInstanceId,
      'service.version': config.serviceVersion,
      'deployment.environment.name': config.environment,
    }).filter((entry): entry is [string, string] => Boolean(entry[1]))
  );

  process.env['OTEL_METRIC_EXPORT_INTERVAL'] = String(
    config.metricExportIntervalMillis
  );

  new NodeSDK({
    resource: resourceFromAttributes(attributes),
    instrumentations,
  }).start();

  if (config.logsEnabled) {
    installConsoleBridge((severity, body) =>
      emitOtelLog('console', severity, body)
    );
  }
}
