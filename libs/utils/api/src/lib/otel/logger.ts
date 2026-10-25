import { ConsoleLogger } from '@nestjs/common';

import { otelLogsEnabled } from './instrumentation';
import { OtelConsoleLogger } from './nest-logger';

export function createNestLogger(env: NodeJS.ProcessEnv = process.env) {
  const json = env.NODE_ENV === 'production';

  if (otelLogsEnabled) {
    return new OtelConsoleLogger({ json });
  }

  return json ? new ConsoleLogger({ json }) : undefined;
}
