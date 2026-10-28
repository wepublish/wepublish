import { Logger, type OnApplicationShutdown } from '@nestjs/common';
import { ErrorReply } from '@redis/client';
import {
  DragonflyConnection,
  type DragonflySetOptions,
} from './dragonfly-connection';
import {
  type DragonflyReply,
  REJECTED_REPLY,
  UNAVAILABLE_REPLY,
} from './dragonfly-reply';
import { CONNECTION_TIMEOUT_MS } from './dragonfly-timeouts';

const UNAVAILABLE_RETRY_MS = 5000;
const COMMAND_TIMEOUT_MS = 2000;
const SILENT_CONNECTION_MS = 5000;

export type DragonflyClient = {
  readonly isOpen: boolean;
  readonly isReady: boolean;
  connect(): Promise<unknown>;
  sendCommand(args: ReadonlyArray<string>): Promise<unknown>;
  close(): Promise<void>;
  destroy(): void;
  on(event: 'error', listener: (error: unknown) => void): unknown;
};

class DragonflyTimeout extends Error {}

const withTimeout = <T>(promise: Promise<T>, ms: number) =>
  new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () =>
        reject(
          new DragonflyTimeout(`Dragonfly did not answer within ${ms} ms`)
        ),
      ms
    );

    promise.then(
      value => {
        clearTimeout(timer);
        resolve(value);
      },
      error => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });

const messageOf = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

const logger = new Logger('Dragonfly');

type Sent = DragonflyReply<unknown>;

export class RedisDragonflyConnection
  extends DragonflyConnection
  implements OnApplicationShutdown
{
  readonly shared = true;
  private unavailableUntil = 0;
  private unreachableSince?: number;
  private lastLogged?: number;
  private connecting?: Promise<void>;
  private closed = false;

  constructor(
    private readonly client: DragonflyClient,
    private readonly keyPrefix: string
  ) {
    super();
    client.on('error', error =>
      this.logOutage(`Dragonfly connection failed: ${messageOf(error)}`)
    );
  }

  isAvailable() {
    return Date.now() >= this.unavailableUntil;
  }

  outageSince() {
    return this.unreachableSince;
  }

  async get(key: string): Promise<DragonflyReply<string | null>> {
    const reply = await this.send(['GET', this.key(key)]);

    return reply.ok === false ?
        reply
      : {
          ok: true,
          value: typeof reply.value === 'string' ? reply.value : null,
        };
  }

  async mget(
    keys: readonly string[]
  ): Promise<DragonflyReply<Array<string | null>>> {
    if (!keys.length) {
      return { ok: true, value: [] };
    }

    const reply = await this.send(['MGET', ...keys.map(key => this.key(key))]);

    if (reply.ok === false) {
      return reply;
    }

    return {
      ok: true,
      value: keys.map((_, index) => {
        const value = Array.isArray(reply.value) ? reply.value[index] : null;

        return typeof value === 'string' ? value : null;
      }),
    };
  }

  async set(
    key: string,
    value: string,
    { px, nx }: DragonflySetOptions = {}
  ): Promise<DragonflyReply<boolean>> {
    const reply = await this.send([
      'SET',
      this.key(key),
      value,
      ...(nx ? ['NX'] : []),
      ...(px ? ['PX', String(px)] : []),
    ]);

    return reply.ok === false ?
        reply
      : { ok: true, value: reply.value === 'OK' };
  }

  async incr(key: string): Promise<DragonflyReply<number>> {
    const reply = await this.send(['INCR', this.key(key)]);

    if (reply.ok === false) {
      return reply;
    }

    return typeof reply.value === 'number' ?
        { ok: true, value: reply.value }
      : REJECTED_REPLY;
  }

  async pexpire(key: string, px: number): Promise<DragonflyReply<boolean>> {
    const reply = await this.send(['PEXPIRE', this.key(key), String(px)]);

    return reply.ok === false ? reply : { ok: true, value: reply.value === 1 };
  }

  async del(keys: readonly string[]): Promise<DragonflyReply<number>> {
    if (!keys.length) {
      return { ok: true, value: 0 };
    }

    const reply = await this.send(['DEL', ...keys.map(key => this.key(key))]);

    return reply.ok === false ?
        reply
      : {
          ok: true,
          value: typeof reply.value === 'number' ? reply.value : 0,
        };
  }

  async probe(key: string, value: string, px: number) {
    const reply = await this.send(
      ['SET', this.key(key), value, 'PX', String(px)],
      { probe: true }
    );

    return reply.ok && reply.value === 'OK';
  }

  async close() {
    if (this.closed) {
      return;
    }

    this.closed = true;

    if (!this.client.isOpen) {
      return;
    }

    try {
      await withTimeout(this.client.close(), CONNECTION_TIMEOUT_MS);
    } catch {
      try {
        this.client.destroy();
      } catch {
        return;
      }
    }
  }

  async onApplicationShutdown() {
    await this.close();
  }

  private key(key: string) {
    return `${this.keyPrefix}::${key}`;
  }

  private logOutage(message: string) {
    const now = Date.now();

    if (
      this.lastLogged !== undefined &&
      now - this.lastLogged < UNAVAILABLE_RETRY_MS
    ) {
      return;
    }

    this.lastLogged = now;
    logger.error(message);
  }

  private async connectedClient(): Promise<DragonflyClient> {
    if (!this.client.isOpen || !this.client.isReady) {
      this.connecting ??= this.connect().finally(() => {
        this.connecting = undefined;
      });

      try {
        await withTimeout(this.connecting, CONNECTION_TIMEOUT_MS);
      } catch (error) {
        throw error instanceof DragonflyTimeout ?
            new Error(
              `Dragonfly did not connect within ${CONNECTION_TIMEOUT_MS} ms`
            )
          : error;
      }
    }

    return this.client;
  }

  private async connect() {
    if (this.client.isOpen) {
      return;
    }

    try {
      await withTimeout(this.client.connect(), CONNECTION_TIMEOUT_MS);
    } catch (error) {
      if (error instanceof DragonflyTimeout && this.client.isOpen) {
        this.client.destroy();
      }

      throw error;
    }
  }

  private dropIfSilent(reply: Promise<unknown>) {
    withTimeout(reply, SILENT_CONNECTION_MS - COMMAND_TIMEOUT_MS).catch(
      error => {
        if (error instanceof DragonflyTimeout && this.client.isOpen) {
          this.client.destroy();
        }
      }
    );
  }

  private async send(command: string[], { probe = false } = {}): Promise<Sent> {
    if (this.closed || (!probe && !this.isAvailable())) {
      return UNAVAILABLE_REPLY;
    }

    let reply: Promise<unknown> | undefined;

    try {
      const client = await this.connectedClient();
      reply = client.sendCommand(command);
      const value = await withTimeout(reply, COMMAND_TIMEOUT_MS);
      this.unreachableSince = undefined;

      return { ok: true, value: value ?? null };
    } catch (error) {
      if (error instanceof DragonflyTimeout && reply) {
        this.dropIfSilent(reply);
      }

      if (reply && error instanceof ErrorReply) {
        this.logOutage(`Dragonfly refused ${command[0]}: ${messageOf(error)}`);

        return REJECTED_REPLY;
      }

      if (!probe) {
        this.unavailableUntil = Date.now() + UNAVAILABLE_RETRY_MS;
        this.unreachableSince ??= Date.now();
        this.logOutage(
          `Dragonfly unavailable, caching on this replica only for the next ${
            UNAVAILABLE_RETRY_MS / 1000
          } s: ${messageOf(error)}`
        );
      }

      return UNAVAILABLE_REPLY;
    }
  }
}
