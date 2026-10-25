import { createRequire } from 'module';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

import { loadOtelModules } from './otel-modules';

const nodeRequire = createRequire(join(process.cwd(), 'package.json'));

describe('real otel modules', () => {
  it('keys every factory by the instrumentation name it builds', () => {
    const { instrumentationFactories } = loadOtelModules();

    for (const [name, factory] of Object.entries(instrumentationFactories)) {
      const instrumentation = factory();
      instrumentation.disable();

      expect(instrumentation.instrumentationName).toBe(name);
    }

    expect(Object.keys(instrumentationFactories)).toHaveLength(7);
  });

  it('patches the installed @nestjs/core', () => {
    const { NestInstrumentation } = nodeRequire(
      '@opentelemetry/instrumentation-nestjs-core'
    ) as typeof import('@opentelemetry/instrumentation-nestjs-core');
    const { isWrapped } = nodeRequire(
      '@opentelemetry/instrumentation'
    ) as typeof import('@opentelemetry/instrumentation');
    const instrumentation = new NestInstrumentation();

    const { RouterExecutionContext } = nodeRequire(
      '@nestjs/core/router/router-execution-context.js'
    );

    expect(isWrapped(RouterExecutionContext.prototype.create)).toBe(true);
    instrumentation.disable();
  });
});
