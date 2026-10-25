import { createRequire } from 'module';
import { join } from 'path';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { emitOtelLog } from './log-bridge';

const nodeRequire = createRequire(join(process.cwd(), 'package.json'));
const { logs } = nodeRequire(
  '@opentelemetry/api-logs'
) as typeof import('@opentelemetry/api-logs');

const emit = vi.fn();
const getLogger = vi.fn((name: string) => ({ emit }));

describe('otel log bridge', () => {
  beforeAll(() => {
    logs.setGlobalLoggerProvider({ getLogger } as never);
  });

  afterAll(() => {
    logs.disable();
  });

  beforeEach(() => {
    emit.mockClear();
    getLogger.mockClear();
  });

  it('emits through the wepublish logger with severity and defined attributes', () => {
    emitOtelLog('nest', 'warn', 'careful', {
      'nest.context': 'Bootstrap',
      'exception.stacktrace': undefined,
    });

    expect(getLogger.mock.calls[0]?.[0]).toBe('wepublish');
    expect(emit).toHaveBeenCalledWith({
      severityNumber: 13,
      severityText: 'WARN',
      body: 'careful',
      attributes: { 'log.source': 'nest', 'nest.context': 'Bootstrap' },
    });
  });

  it('accepts a resolved severity', () => {
    emitOtelLog('console', { severityNumber: 5, severityText: 'DEBUG' }, 'x');

    expect(emit).toHaveBeenCalledWith({
      severityNumber: 5,
      severityText: 'DEBUG',
      body: 'x',
      attributes: { 'log.source': 'console' },
    });
  });
});
