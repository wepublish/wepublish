import { hostname } from 'os';
import { getOtelConfig } from '@wepublish/utils/otel';

import { startNodeOtel } from './start';

const config = getOtelConfig(process.env, hostname());

if (config) {
  startNodeOtel(config);
}

export const otelEnabled = Boolean(config);

export const otelLogsEnabled = Boolean(config?.logsEnabled);
