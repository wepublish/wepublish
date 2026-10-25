// @vitest-environment node
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

const otelPackages = [
  '@opentelemetry/api',
  '@opentelemetry/api-logs',
  '@opentelemetry/sdk-node',
  '@opentelemetry/sdk-logs',
  '@opentelemetry/sdk-metrics',
  '@opentelemetry/sdk-trace-node',
  '@opentelemetry/resources',
  '@opentelemetry/exporter-metrics-otlp-http',
  '@opentelemetry/exporter-logs-otlp-http',
  '@opentelemetry/exporter-trace-otlp-http',
  '@opentelemetry/instrumentation',
  '@opentelemetry/instrumentation-runtime-node',
  '@opentelemetry/instrumentation-undici',
];

const loadNextConfig = () =>
  createRequire(__filename)(join(__dirname, '..', 'next.config.js')) as {
    env: Record<string, unknown>;
    serverExternalPackages?: string[];
  };

describe('website telemetry stays on the server', () => {
  it('keeps OTel out of the client instrumentation', () => {
    const source = readFileSync(
      join(__dirname, '..', 'sentry', 'instrumentation.client.ts'),
      'utf-8'
    );

    expect(source).not.toContain('@opentelemetry');
    expect(source.toLowerCase()).not.toContain('otel');
  });

  it('never inlines OTEL_ variables into the client env', () => {
    const { env } = loadNextConfig();

    expect(Object.keys(env).filter(key => /^OTEL_/.test(key))).toEqual([]);
  });

  it('keeps every OTel package external to the server bundle', () => {
    const { serverExternalPackages } = loadNextConfig();

    expect(serverExternalPackages).toEqual(
      expect.arrayContaining(otelPackages)
    );
  });
});
