import { Logger } from '@nestjs/common';
import { ErrorReply } from '@redis/client';
import { MemoryDragonflyConnection } from './memory-dragonfly-connection';
import {
  type DragonflyClient,
  RedisDragonflyConnection,
} from './redis-dragonfly-connection';

const PREFIX = 'wepublish-demo';

type FakeClient = {
  isOpen: boolean;
  isReady: boolean;
  sendCommand: ReturnType<typeof vi.fn>;
  connect: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
  destroy: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
};

const fakeClient = (
  sendCommand: ReturnType<typeof vi.fn>,
  overrides: Partial<FakeClient> = {}
) => {
  const client: FakeClient = {
    isOpen: true,
    isReady: true,
    sendCommand,
    connect: vi.fn(async () => {
      client.isOpen = true;
      client.isReady = true;
    }),
    close: vi.fn(async () => {
      client.isOpen = false;
      client.isReady = false;
    }),
    destroy: vi.fn(() => {
      client.isOpen = false;
      client.isReady = false;
    }),
    on: vi.fn(),
    ...overrides,
  };

  return client;
};

const connect = (client: FakeClient) =>
  new RedisDragonflyConnection(client as unknown as DragonflyClient, PREFIX);

const create = (sendCommand: ReturnType<typeof vi.fn>) => {
  const client = fakeClient(sendCommand);

  return { client, connection: connect(client) };
};

const unavailable = { ok: false, reason: 'unavailable' };

describe('RedisDragonflyConnection', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('is shared between replicas, unlike memory', () => {
    expect(create(vi.fn()).connection.shared).toBe(true);
    expect(new MemoryDragonflyConnection().shared).toBe(false);
  });

  it('listens for client errors once, so an outage never crashes the process', async () => {
    const { client, connection } = create(vi.fn().mockResolvedValue('v1'));

    for (let attempt = 0; attempt < 3; attempt++) {
      await connection.get('nsv:settings');
      client.isOpen = false;
      client.isReady = false;
    }

    expect(client.on).toHaveBeenCalledTimes(1);
    expect(client.on).toHaveBeenCalledWith('error', expect.any(Function));
  });

  describe('shutting down', () => {
    const closing = (sendCommand: ReturnType<typeof vi.fn>) => {
      const client = fakeClient(sendCommand);
      client.close = vi.fn(() => {
        client.isOpen = false;

        return new Promise<void>(() => undefined);
      });

      return { client, connection: connect(client) };
    };

    it('finishes shutting down when Dragonfly never answers while closing', async () => {
      const { client, connection } = closing(vi.fn());
      let closed = false;

      void connection.close().then(() => (closed = true));
      await vi.advanceTimersByTimeAsync(1000);

      expect(closed).toBe(true);
      expect(client.destroy).toHaveBeenCalled();
    });

    it('sends nothing after shutting down, so a delayed reset cannot open a new connection', async () => {
      const sendCommand = vi.fn().mockResolvedValue('OK');
      const { client, connection } = closing(sendCommand);

      void connection.close();
      await vi.advanceTimersByTimeAsync(1000);

      await expect(connection.del(['val:x'])).resolves.toEqual(unavailable);
      await expect(connection.set('nsv:settings', 'v2')).resolves.toEqual(
        unavailable
      );
      expect(sendCommand).not.toHaveBeenCalled();
      expect(client.connect).not.toHaveBeenCalled();
    });

    it('closes when the application shuts down', async () => {
      const { client, connection } = create(vi.fn());

      await connection.onApplicationShutdown();

      expect(client.close).toHaveBeenCalledTimes(1);
    });
  });

  describe('commands', () => {
    it('sends only commands the production ACL allows, every key under the prefix of its medium', async () => {
      const sendCommand = vi.fn(async (command: string[]) =>
        command[0] === 'INCR' || command[0] === 'PEXPIRE' ? 1
        : command[0] === 'MGET' ? [null, null]
        : command[0] === 'DEL' ? 1
        : 'OK'
      );
      const { connection } = create(sendCommand);

      await connection.probe('health', '1', 60_000);
      await connection.set('lock:nightly-job', 'token', {
        px: 60_000,
        nx: true,
      });
      await connection.pexpire('lock:periodic-job-run', 120_000);
      await connection.get('nsv:settings');
      await connection.mget(['nsv:navigations', 'nsv:banners']);
      await connection.set('val:dev:x', '{}', { px: 60_000 });
      await connection.incr('count:totp-failures:1');
      await connection.del(['val:dev:x', 'val:dev:y']);

      const commands = sendCommand.mock.calls.map(([command]) => command);
      const keys = commands.flatMap(([name, ...args]) =>
        name === 'MGET' || name === 'DEL' ? args : [args[0]]
      );

      expect(
        commands.every(([name]) =>
          ['PING', 'GET', 'MGET', 'SET', 'INCR', 'PEXPIRE', 'DEL'].includes(
            name
          )
        )
      ).toBe(true);
      expect(keys).toHaveLength(10);
      expect(keys.every(key => key.startsWith(`${PREFIX}::`))).toBe(true);
    });

    it('writes the keys the websites read byte for byte', async () => {
      const sendCommand = vi.fn().mockResolvedValue('OK');
      const { connection } = create(sendCommand);

      await connection.get('nsv:x');
      await connection.set('website:heartbeat', '1', { px: 60_000 });

      expect(sendCommand.mock.calls.map(([command]) => command)).toEqual([
        ['GET', 'wepublish-demo::nsv:x'],
        ['SET', 'wepublish-demo::website:heartbeat', '1', 'PX', '60000'],
      ]);
    });

    it('answers a missing key with null', async () => {
      const { connection } = create(vi.fn().mockResolvedValue(null));

      await expect(connection.get('nsv:settings')).resolves.toEqual({
        ok: true,
        value: null,
      });
    });

    it('answers a batch by position, with null for missing keys', async () => {
      const sendCommand = vi.fn().mockResolvedValue(['a', null, 'c']);
      const { connection } = create(sendCommand);

      await expect(connection.mget(['x', 'y', 'z'])).resolves.toEqual({
        ok: true,
        value: ['a', null, 'c'],
      });
      expect(sendCommand).toHaveBeenCalledWith([
        'MGET',
        'wepublish-demo::x',
        'wepublish-demo::y',
        'wepublish-demo::z',
      ]);
    });

    it('sends nothing for an empty batch', async () => {
      const sendCommand = vi.fn();
      const { connection } = create(sendCommand);

      await expect(connection.mget([])).resolves.toEqual({
        ok: true,
        value: [],
      });
      await expect(connection.del([])).resolves.toEqual({ ok: true, value: 0 });
      expect(sendCommand).not.toHaveBeenCalled();
    });

    it('tells whether a key it only sets when absent was set', async () => {
      const sendCommand = vi
        .fn()
        .mockResolvedValueOnce('OK')
        .mockResolvedValueOnce(null);
      const { connection } = create(sendCommand);

      await expect(
        connection.set('lock:job', 'a', { px: 60_000, nx: true })
      ).resolves.toEqual({ ok: true, value: true });
      await expect(
        connection.set('lock:job', 'b', { px: 60_000, nx: true })
      ).resolves.toEqual({ ok: true, value: false });
      expect(sendCommand).toHaveBeenLastCalledWith([
        'SET',
        'wepublish-demo::lock:job',
        'b',
        'NX',
        'PX',
        '60000',
      ]);
    });

    it('cannot tell whether a key it only sets when absent was set when Dragonfly does not answer', async () => {
      const { connection } = create(
        vi.fn().mockRejectedValue(new Error('ECONNRESET'))
      );

      await expect(
        connection.set('lock:job', 'a', { px: 60_000, nx: true })
      ).resolves.toEqual(unavailable);
    });

    it('extends a key with PEXPIRE and tells whether it was still there', async () => {
      const sendCommand = vi
        .fn()
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(0);
      const { connection } = create(sendCommand);

      await expect(connection.pexpire('lock:job', 120_000)).resolves.toEqual({
        ok: true,
        value: true,
      });
      await expect(connection.pexpire('lock:job', 120_000)).resolves.toEqual({
        ok: true,
        value: false,
      });
      expect(sendCommand).toHaveBeenCalledWith([
        'PEXPIRE',
        'wepublish-demo::lock:job',
        '120000',
      ]);
    });

    it('counts with INCR and deletes several keys with one DEL', async () => {
      const sendCommand = vi
        .fn()
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(2);
      const { connection } = create(sendCommand);

      await expect(connection.incr('count:x')).resolves.toEqual({
        ok: true,
        value: 3,
      });
      await expect(connection.del(['a', 'b'])).resolves.toEqual({
        ok: true,
        value: 2,
      });
      expect(sendCommand.mock.calls.map(([command]) => command)).toEqual([
        ['INCR', 'wepublish-demo::count:x'],
        ['DEL', 'wepublish-demo::a', 'wepublish-demo::b'],
      ]);
    });
  });

  describe('failures', () => {
    it('stops asking Dragonfly for five seconds after a failure', async () => {
      const sendCommand = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));
      const { connection } = create(sendCommand);

      await expect(connection.get('nsv:settings')).resolves.toEqual(
        unavailable
      );
      vi.advanceTimersByTime(4999);
      await connection.get('nsv:settings');
      await connection.set('nsv:settings', 'v2');

      expect(sendCommand).toHaveBeenCalledTimes(1);
      expect(connection.isAvailable()).toBe(false);
    });

    it('asks Dragonfly again once the five seconds are over', async () => {
      const sendCommand = vi
        .fn()
        .mockRejectedValueOnce(new Error('ECONNREFUSED'))
        .mockResolvedValue('v1');
      const { connection } = create(sendCommand);

      await connection.get('nsv:settings');
      vi.advanceTimersByTime(5000);

      await expect(connection.get('nsv:settings')).resolves.toEqual({
        ok: true,
        value: 'v1',
      });
      expect(connection.isAvailable()).toBe(true);
    });

    it('waits up to 2 s for an answer, so Dragonfly pausing for a second while it writes a snapshot is no outage', async () => {
      const sendCommand = vi.fn(
        () => new Promise(resolve => setTimeout(() => resolve('v1'), 1500))
      );
      const { connection } = create(sendCommand);

      const reply = connection.get('nsv:settings');
      await vi.advanceTimersByTimeAsync(1500);

      await expect(reply).resolves.toEqual({ ok: true, value: 'v1' });
      expect(connection.isAvailable()).toBe(true);
      expect(connection.outageSince()).toBeUndefined();
    });

    it('gives up on a command Dragonfly does not answer within 2 s', async () => {
      const sendCommand = vi.fn(() => new Promise(() => undefined));
      const { connection } = create(sendCommand);

      const reply = connection.get('nsv:settings');
      await vi.advanceTimersByTimeAsync(2000);

      await expect(reply).resolves.toEqual(unavailable);
      expect(connection.isAvailable()).toBe(false);
    });

    it('remembers since when Dragonfly is unreachable until it answers again', async () => {
      vi.setSystemTime(new Date('2026-10-02T10:00:00.000Z'));
      const sendCommand = vi
        .fn()
        .mockImplementationOnce(() => new Promise(() => undefined))
        .mockRejectedValueOnce(new Error('ECONNREFUSED'))
        .mockResolvedValue('v1');
      const { connection } = create(sendCommand);
      const startedAt = Date.now();

      const reply = connection.get('nsv:settings');
      await vi.advanceTimersByTimeAsync(2000);
      await reply;
      expect(connection.outageSince()).toBe(startedAt + 2000);

      vi.advanceTimersByTime(5000);
      await connection.get('nsv:settings');
      expect(connection.outageSince()).toBe(startedAt + 2000);

      vi.advanceTimersByTime(5000);
      await connection.get('nsv:settings');
      expect(connection.outageSince()).toBeUndefined();
    });

    it('treats an error reply as a refusal, not an outage, so a full Dragonfly does not stop every read', async () => {
      const sendCommand = vi
        .fn()
        .mockRejectedValueOnce(new ErrorReply('OOM command not allowed'))
        .mockResolvedValue('v1');
      const { client, connection } = create(sendCommand);
      vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

      await expect(connection.set('val:dev:x', '{}')).resolves.toEqual({
        ok: false,
        reason: 'rejected',
      });

      expect(connection.isAvailable()).toBe(true);
      expect(connection.outageSince()).toBeUndefined();
      await expect(connection.get('nsv:settings')).resolves.toEqual({
        ok: true,
        value: 'v1',
      });
      expect(client.destroy).not.toHaveBeenCalled();
    });

    it('treats a handshake Dragonfly refuses as an outage, so a wrong password does not reconnect on every command', async () => {
      const sendCommand = vi.fn().mockResolvedValue('v1');
      const client = fakeClient(sendCommand, { isOpen: false, isReady: false });
      client.connect.mockRejectedValue(
        new ErrorReply('WRONGPASS invalid username-password pair')
      );
      const connection = connect(client);
      vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
      const startedAt = Date.now();

      await expect(connection.get('nsv:settings')).resolves.toEqual(
        unavailable
      );
      expect(connection.isAvailable()).toBe(false);
      expect(connection.outageSince()).toBe(startedAt);

      vi.advanceTimersByTime(4999);
      await expect(connection.get('nsv:settings')).resolves.toEqual(
        unavailable
      );

      expect(client.connect).toHaveBeenCalledTimes(1);
      expect(sendCommand).not.toHaveBeenCalled();
    });

    it('logs an outage once, not once per command that was in flight', async () => {
      const logged = vi
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => undefined);
      const { client, connection } = create(
        vi.fn().mockRejectedValue(new Error('The client is offline'))
      );

      await Promise.all([
        connection.get('nsv:a'),
        connection.get('nsv:b'),
        connection.mget(['val:a', 'val:b']),
      ]);
      client.on.mock.calls[0][1](new Error('Socket closed unexpectedly'));

      expect(logged).toHaveBeenCalledTimes(1);
    });

    it('logs a lasting outage at most every five seconds', async () => {
      const logged = vi
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => undefined);
      const { client, connection } = create(
        vi.fn().mockRejectedValue(new Error('ECONNREFUSED'))
      );
      const onError = client.on.mock.calls[0][1];

      await connection.get('nsv:a');
      onError(new Error('ECONNREFUSED'));
      vi.advanceTimersByTime(4999);
      onError(new Error('ECONNREFUSED'));
      vi.advanceTimersByTime(1);
      onError(new Error('ECONNREFUSED'));

      expect(logged).toHaveBeenCalledTimes(2);
    });

    it('still probes Dragonfly for /health while other commands pause after a failure, so /health shows whether it answers now', async () => {
      const sendCommand = vi
        .fn()
        .mockRejectedValueOnce(new Error('ECONNREFUSED'))
        .mockResolvedValue('OK');
      const { connection } = create(sendCommand);

      await connection.get('nsv:settings');
      expect(connection.isAvailable()).toBe(false);

      await expect(connection.probe('health', '1', 60_000)).resolves.toBe(true);
      expect(sendCommand).toHaveBeenLastCalledWith([
        'SET',
        'wepublish-demo::health',
        '1',
        'PX',
        '60000',
      ]);
    });

    it('does not pause the other commands when a probe fails', async () => {
      const sendCommand = vi
        .fn()
        .mockRejectedValueOnce(new Error('ECONNREFUSED'))
        .mockResolvedValue('v1');
      const { connection } = create(sendCommand);

      await expect(connection.probe('health', '1', 60_000)).resolves.toBe(
        false
      );

      expect(connection.isAvailable()).toBe(true);
      expect(connection.outageSince()).toBeUndefined();
      await expect(connection.get('nsv:settings')).resolves.toEqual({
        ok: true,
        value: 'v1',
      });
    });
  });

  describe('connection', () => {
    it('drops a connection that has not answered for 5 s, so the next command connects anew instead of waiting on a dead socket', async () => {
      const { client, connection } = create(
        vi
          .fn()
          .mockImplementationOnce(() => new Promise(() => undefined))
          .mockResolvedValue('v1')
      );

      const reply = connection.get('nsv:settings');
      await vi.advanceTimersByTimeAsync(2000);
      await expect(reply).resolves.toEqual(unavailable);
      expect(client.destroy).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(3000);
      expect(client.destroy).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(2000);

      await expect(connection.get('nsv:settings')).resolves.toEqual({
        ok: true,
        value: 'v1',
      });
      expect(client.connect).toHaveBeenCalledTimes(1);
    });

    it('keeps a connection whose answer only comes late, so a slow moment costs no reconnect', async () => {
      const { client, connection } = create(
        vi
          .fn()
          .mockImplementationOnce(
            () => new Promise(resolve => setTimeout(() => resolve('v1'), 3000))
          )
          .mockResolvedValue('v1')
      );

      const reply = connection.get('nsv:settings');
      await vi.advanceTimersByTimeAsync(2000);
      await expect(reply).resolves.toEqual(unavailable);
      await vi.advanceTimersByTimeAsync(10_000);

      expect(client.destroy).not.toHaveBeenCalled();
      await expect(connection.get('nsv:settings')).resolves.toEqual({
        ok: true,
        value: 'v1',
      });
      expect(client.connect).not.toHaveBeenCalled();
    });

    it('gives a reconnect its full second for the handshake', async () => {
      const { client, connection } = create(vi.fn().mockResolvedValue('v1'));
      await connection.get('nsv:settings');
      client.isOpen = false;
      client.isReady = false;
      client.connect.mockImplementationOnce(
        () =>
          new Promise<void>(resolve =>
            setTimeout(() => {
              client.isOpen = true;
              client.isReady = true;
              resolve();
            }, 800)
          )
      );

      const reply = connection.get('nsv:settings');
      await vi.advanceTimersByTimeAsync(800);

      await expect(reply).resolves.toEqual({ ok: true, value: 'v1' });
    });

    it('reconnects through the one client it was given', async () => {
      const { client, connection } = create(vi.fn().mockResolvedValue('v1'));

      for (let attempt = 0; attempt < 15; attempt++) {
        await connection.get('nsv:settings');
        client.isOpen = false;
        client.isReady = false;
      }

      expect(client.on).toHaveBeenCalledTimes(1);
      expect(client.connect).toHaveBeenCalledTimes(14);
    });

    it('lets commands sent at the same time on a fresh replica wait for the one connection being set up', async () => {
      let ready!: () => void;
      const client = fakeClient(vi.fn(), { isOpen: false, isReady: false });
      client.sendCommand = vi.fn(async () => {
        if (!client.isReady) {
          throw new Error('The client is offline');
        }

        return 'v1';
      });
      client.connect = vi.fn(async () => {
        client.isOpen = true;
        await new Promise<void>(resolve => (ready = resolve));
        client.isReady = true;
      });
      const connection = connect(client);

      const replies = ['a', 'b', 'c', 'd'].map(key => connection.get(key));
      await vi.advanceTimersByTimeAsync(10);
      ready();

      await expect(Promise.all(replies)).resolves.toEqual(
        Array(4).fill({ ok: true, value: 'v1' })
      );
      expect(connection.isAvailable()).toBe(true);
      expect(client.connect).toHaveBeenCalledTimes(1);
    });

    it('works again once Dragonfly is back, even when it came back while a connection was being set up', async () => {
      let handshake!: () => void;
      const client = fakeClient(vi.fn(), { isOpen: false, isReady: false });
      client.sendCommand = vi.fn(async () => {
        if (!client.isOpen) {
          throw new Error('The client is closed');
        }

        if (!client.isReady) {
          throw new Error('The client is offline');
        }

        return 'v1';
      });
      client.connect = vi.fn(async () => {
        client.isOpen = true;
        await new Promise<void>(resolve => (handshake = resolve));
        client.isReady = true;
      });
      const connection = connect(client);

      const whilePaused = connection.get('nsv:settings');
      await vi.advanceTimersByTimeAsync(1000);
      await expect(whilePaused).resolves.toEqual(unavailable);

      handshake();
      await vi.advanceTimersByTimeAsync(5000);
      const afterwards = connection.get('nsv:settings');
      await vi.advanceTimersByTimeAsync(10);
      handshake?.();

      await expect(afterwards).resolves.toEqual({ ok: true, value: 'v1' });
    });

    it('gives up on a first connect whose handshake Dragonfly never answers, so the next command connects anew', async () => {
      let answering = false;
      const client = fakeClient(vi.fn(), { isOpen: false, isReady: false });
      client.sendCommand = vi.fn(async () => {
        if (!client.isOpen) {
          throw new Error('The client is closed');
        }

        if (!client.isReady) {
          throw new Error('The client is offline');
        }

        return 'v1';
      });
      client.connect = vi.fn(() => {
        client.isOpen = true;

        return answering ?
            Promise.resolve().then(() => {
              client.isReady = true;
            })
          : new Promise<void>(() => undefined);
      });
      const connection = connect(client);

      const hung = connection.get('nsv:settings');
      await vi.advanceTimersByTimeAsync(1000);
      await expect(hung).resolves.toEqual(unavailable);
      expect(client.destroy).toHaveBeenCalledTimes(1);

      answering = true;
      await vi.advanceTimersByTimeAsync(5000);
      const afterwards = connection.get('nsv:settings');
      await vi.advanceTimersByTimeAsync(10);

      await expect(afterwards).resolves.toEqual({ ok: true, value: 'v1' });
      expect(client.connect).toHaveBeenCalledTimes(2);
    });

    it('gives up on a reconnect whose handshake Dragonfly never answers, so it can connect again later', async () => {
      let answering = true;
      const client = fakeClient(vi.fn());
      client.sendCommand = vi.fn(async () => {
        if (!client.isOpen) {
          throw new Error('The client is closed');
        }

        if (!client.isReady) {
          throw new Error('The client is offline');
        }

        return 'v1';
      });
      client.connect = vi.fn(() => {
        client.isOpen = true;

        return answering ?
            Promise.resolve().then(() => {
              client.isReady = true;
            })
          : new Promise<void>(() => undefined);
      });
      const connection = connect(client);

      await expect(connection.get('nsv:settings')).resolves.toEqual({
        ok: true,
        value: 'v1',
      });
      client.isOpen = false;
      client.isReady = false;
      answering = false;

      const silent = connection.get('nsv:settings');
      await vi.advanceTimersByTimeAsync(1000);
      await expect(silent).resolves.toEqual(unavailable);

      answering = true;
      await vi.advanceTimersByTimeAsync(5000);
      const afterwards = connection.get('nsv:settings');
      await vi.advanceTimersByTimeAsync(600);

      await expect(afterwards).resolves.toEqual({ ok: true, value: 'v1' });
      expect(client.destroy).toHaveBeenCalled();
    });

    it('keeps a connection that answered, even with an error', async () => {
      const { client, connection } = create(
        vi
          .fn()
          .mockRejectedValue(
            new ErrorReply('NOPERM this user has no permissions')
          )
      );
      vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

      await connection.get('other::key');

      expect(client.destroy).not.toHaveBeenCalled();
    });
  });
});
