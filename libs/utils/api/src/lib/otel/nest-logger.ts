import { ConsoleLogger, LogLevel } from '@nestjs/common';

import { emitOtelLog } from './log-bridge';

const formatMessage = (message: unknown) => {
  if (typeof message === 'string') {
    return message;
  }

  if (message instanceof Error) {
    return message.message;
  }

  try {
    return JSON.stringify(message) ?? String(message);
  } catch {
    return String(message);
  }
};

export class OtelConsoleLogger extends ConsoleLogger {
  protected override printMessages(
    messages: unknown[],
    context?: string,
    logLevel?: LogLevel,
    writeStreamType?: 'stdout' | 'stderr',
    errorStack?: unknown,
    params?: Record<string, any>
  ): void {
    super.printMessages(
      messages,
      context,
      logLevel,
      writeStreamType,
      errorStack,
      params
    );

    for (const message of messages) {
      try {
        emitOtelLog('nest', logLevel ?? 'log', formatMessage(message), {
          ...params,
          'nest.context': context,
          'exception.stacktrace':
            errorStack ??
            (message instanceof Error ? message.stack : undefined),
        });
      } catch {
        continue;
      }
    }
  }
}
