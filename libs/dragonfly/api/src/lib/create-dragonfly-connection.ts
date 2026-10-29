import { createClient } from '@redis/client';
import { DragonflyConnection } from './dragonfly-connection';
import { type DragonflyOptions } from './dragonfly-options';
import {
  CONNECTION_TIMEOUT_MS,
  KEEP_ALIVE_INITIAL_DELAY_MS,
} from './dragonfly-timeouts';
import { MemoryDragonflyConnection } from './memory-dragonfly-connection';
import { RedisDragonflyConnection } from './redis-dragonfly-connection';

const tlsOptions = (url: string, ca?: string) => {
  if (new URL(url).protocol !== 'rediss:') {
    return {};
  }

  return {
    tls: true as const,
    rejectUnauthorized: true,
    ...(ca ? { ca } : {}),
  };
};

export function createDragonflyConnection(
  options: DragonflyOptions
): DragonflyConnection {
  if (!options.url) {
    return new MemoryDragonflyConnection();
  }

  const client = createClient({
    url: options.url,
    disableOfflineQueue: true,
    RESP: 2,
    maintNotifications: 'disabled',
    commandOptions: { timeout: undefined },
    socket: {
      reconnectStrategy: false,
      connectTimeout: CONNECTION_TIMEOUT_MS,
      keepAliveInitialDelay: KEEP_ALIVE_INITIAL_DELAY_MS,
      ...tlsOptions(options.url, options.ca),
    },
  });

  return new RedisDragonflyConnection(client, options.keyPrefix);
}
