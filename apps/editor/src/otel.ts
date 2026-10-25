import { hostname } from 'os';

import { loadEditorOtelModules } from './otel-modules';

export function startEditorOtel(
  env: Record<string, string | undefined> = process.env
) {
  if (!env['OTEL_EXPORTER_OTLP_ENDPOINT']?.trim()) {
    return undefined;
  }

  if (env['OTEL_SDK_DISABLED'] === 'true') {
    return undefined;
  }

  const metricExportInterval = Number(env['OTEL_METRIC_EXPORT_INTERVAL']);
  process.env['OTEL_METRIC_EXPORT_INTERVAL'] = String(
    metricExportInterval > 0 ? metricExportInterval : 15000
  );

  const {
    NodeSDK,
    HttpInstrumentation,
    ExpressInstrumentation,
    RuntimeNodeInstrumentation,
    resourceFromAttributes,
  } = loadEditorOtelModules();

  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      'service.name': env['OTEL_SERVICE_NAME'] || 'wepublish-editor',
      'service.instance.id': env['OTEL_SERVICE_INSTANCE_ID'] || hostname(),
    }),
    instrumentations: [
      new HttpInstrumentation({
        ignoreIncomingRequestHook: request => request.url === '/health',
      }),
      new ExpressInstrumentation(),
      new RuntimeNodeInstrumentation(),
    ],
  });

  sdk.start();

  require('http');
  require('express');

  return sdk;
}

startEditorOtel();
