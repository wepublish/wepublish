import { createClient } from '@redis/client';
import { createDragonflyConnection } from './create-dragonfly-connection';
import { MemoryDragonflyConnection } from './memory-dragonfly-connection';
import { RedisDragonflyConnection } from './redis-dragonfly-connection';

vi.mock('@redis/client', async importOriginal => ({
  ...(await importOriginal<typeof import('@redis/client')>()),
  createClient: vi.fn(() => ({
    isOpen: false,
    isReady: false,
    on: vi.fn(),
    connect: vi.fn(),
    sendCommand: vi.fn(),
    close: vi.fn(),
    destroy: vi.fn(),
  })),
}));

describe('createDragonflyConnection', () => {
  afterEach(() => {
    vi.mocked(createClient).mockClear();
  });

  it('stays in memory without REDIS_URL', () => {
    expect(
      createDragonflyConnection({ production: false, releaseId: 'dev' })
    ).toBeInstanceOf(MemoryDragonflyConnection);
    expect(createClient).not.toHaveBeenCalled();
  });

  it('does not throw or queue commands while Dragonfly is unreachable', () => {
    const connection = createDragonflyConnection({
      url: 'redis://wepublish-demo-staging:secret@localhost:6379/0',
      keyPrefix: 'wepublish-demo-staging',
      production: false,
      releaseId: 'dev',
    });

    expect(connection).toBeInstanceOf(RedisDragonflyConnection);
    expect(createClient).toHaveBeenCalledWith({
      url: 'redis://wepublish-demo-staging:secret@localhost:6379/0',
      disableOfflineQueue: true,
      RESP: 2,
      maintNotifications: 'disabled',
      commandOptions: { timeout: undefined },
      socket: {
        reconnectStrategy: false,
        connectTimeout: 1000,
        keepAliveInitialDelay: 5000,
      },
    });
  });

  it('verifies a rediss:// url against the system CAs when no CA is given', () => {
    createDragonflyConnection({
      url: 'rediss://wepublish-demo-staging:secret@localhost:6379/0',
      keyPrefix: 'wepublish-demo-staging',
      production: false,
      releaseId: 'dev',
    });

    expect(vi.mocked(createClient).mock.calls[0][0]?.socket).toEqual({
      reconnectStrategy: false,
      connectTimeout: 1000,
      keepAliveInitialDelay: 5000,
      tls: true,
      rejectUnauthorized: true,
    });
  });

  it('verifies Dragonfly against the given CA without overriding the host check', () => {
    createDragonflyConnection({
      url: 'rediss://wepublish-demo-production:secret@dragonfly01.wepublish.cloud:6379/0',
      keyPrefix: 'wepublish-demo-production',
      production: true,
      ca: 'internal-ca',
      releaseId: 'dev',
    });

    const socket = vi.mocked(createClient).mock.calls[0][0]?.socket as Record<
      string,
      unknown
    >;

    expect(socket).toEqual({
      reconnectStrategy: false,
      connectTimeout: 1000,
      keepAliveInitialDelay: 5000,
      tls: true,
      rejectUnauthorized: true,
      ca: 'internal-ca',
    });
    expect(socket['checkServerIdentity']).toBeUndefined();
  });
});
