import { afterEach, describe, expect, it, vi } from 'vitest';

const emitOtelLog = vi.hoisted(() => vi.fn());

vi.mock('./log-bridge', () => ({ emitOtelLog }));

import { OtelConsoleLogger } from './nest-logger';

describe('OtelConsoleLogger', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    emitOtelLog.mockClear();
  });

  it('still prints errors to stderr and emits them with the nest context', () => {
    const stderr = vi
      .spyOn(process.stderr, 'write')
      .mockImplementation(() => true);

    new OtelConsoleLogger().error('boom', 'the stack', 'Ctx');

    expect(stderr).toHaveBeenCalled();
    expect(String(stderr.mock.calls[0][0])).toContain('boom');
    expect(emitOtelLog).toHaveBeenCalledWith('nest', 'error', 'boom', {
      'nest.context': 'Ctx',
      'exception.stacktrace': 'the stack',
    });
  });

  it('prints and emits regular logs, serializing objects', () => {
    const stdout = vi
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true);

    new OtelConsoleLogger().log({ id: 1 }, 'Bootstrap');

    expect(stdout).toHaveBeenCalled();
    expect(emitOtelLog).toHaveBeenCalledWith('nest', 'log', '{"id":1}', {
      'nest.context': 'Bootstrap',
      'exception.stacktrace': undefined,
    });
  });

  it('emits structured params as attributes next to the message', () => {
    const stdout = vi
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true);

    new OtelConsoleLogger({ json: true }).log(
      'mail sent',
      { mailLogID: 'log-1', 'nest.context': 'spoofed' },
      'Mail'
    );

    expect(JSON.parse(String(stdout.mock.calls[0][0]))).toMatchObject({
      message: 'mail sent',
      params: { mailLogID: 'log-1' },
    });
    expect(emitOtelLog).toHaveBeenCalledWith('nest', 'log', 'mail sent', {
      mailLogID: 'log-1',
      'nest.context': 'Mail',
      'exception.stacktrace': undefined,
    });
  });

  it('prints json lines and still emits them when json is on', () => {
    const stdout = vi
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true);

    new OtelConsoleLogger({ json: true }).log('started', 'Bootstrap');

    expect(stdout).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(stdout.mock.calls[0][0]))).toMatchObject({
      level: 'log',
      context: 'Bootstrap',
      message: 'started',
    });
    expect(emitOtelLog).toHaveBeenCalledWith('nest', 'log', 'started', {
      'nest.context': 'Bootstrap',
      'exception.stacktrace': undefined,
    });
  });

  it('prints json errors to stderr and emits them with the stack when json is on', () => {
    const stderr = vi
      .spyOn(process.stderr, 'write')
      .mockImplementation(() => true);

    new OtelConsoleLogger({ json: true }).error('boom', 'the stack', 'Ctx');

    expect(JSON.parse(String(stderr.mock.calls[0][0]))).toMatchObject({
      level: 'error',
      context: 'Ctx',
      message: 'boom',
    });
    expect(emitOtelLog).toHaveBeenCalledWith('nest', 'error', 'boom', {
      'nest.context': 'Ctx',
      'exception.stacktrace': 'the stack',
    });
  });
});
