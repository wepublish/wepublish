import type { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import type { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import type { RuntimeNodeInstrumentation } from '@opentelemetry/instrumentation-runtime-node';
import type { resourceFromAttributes } from '@opentelemetry/resources';
import type { NodeSDK } from '@opentelemetry/sdk-node';

export type EditorOtelModules = {
  NodeSDK: typeof NodeSDK;
  HttpInstrumentation: typeof HttpInstrumentation;
  ExpressInstrumentation: typeof ExpressInstrumentation;
  RuntimeNodeInstrumentation: typeof RuntimeNodeInstrumentation;
  resourceFromAttributes: typeof resourceFromAttributes;
};

export function loadEditorOtelModules(): EditorOtelModules {
  const { NodeSDK } =
    require('@opentelemetry/sdk-node') as typeof import('@opentelemetry/sdk-node');
  const { resourceFromAttributes } =
    require('@opentelemetry/resources') as typeof import('@opentelemetry/resources');
  const { HttpInstrumentation } =
    require('@opentelemetry/instrumentation-http') as typeof import('@opentelemetry/instrumentation-http');
  const { ExpressInstrumentation } =
    require('@opentelemetry/instrumentation-express') as typeof import('@opentelemetry/instrumentation-express');
  const { RuntimeNodeInstrumentation } =
    require('@opentelemetry/instrumentation-runtime-node') as typeof import('@opentelemetry/instrumentation-runtime-node');

  return {
    NodeSDK,
    HttpInstrumentation,
    ExpressInstrumentation,
    RuntimeNodeInstrumentation,
    resourceFromAttributes,
  };
}
