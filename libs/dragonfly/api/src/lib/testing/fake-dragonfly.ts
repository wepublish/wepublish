import {
  DragonflyConnection,
  type DragonflySetOptions,
} from '../dragonfly-connection';
import {
  type DragonflyReply,
  REJECTED_REPLY,
  UNAVAILABLE_REPLY,
} from '../dragonfly-reply';
import { MemoryDragonflyConnection } from '../memory-dragonfly-connection';

export class FakeDragonfly extends DragonflyConnection {
  readonly shared = true;
  readonly commands: string[][] = [];
  private memory = new MemoryDragonflyConnection();
  private isDown = false;
  private unreachableSince?: number;
  private rejecting = new Set<string>();
  private stallMs = 0;

  down() {
    this.isDown = true;
    this.unreachableSince ??= Date.now();
  }

  up() {
    this.isDown = false;
  }

  rejectNext(command: string) {
    this.rejecting.add(command.toUpperCase());
  }

  stall(ms: number) {
    this.stallMs = ms;
  }

  isAvailable() {
    return !this.isDown;
  }

  outageSince() {
    return this.unreachableSince;
  }

  get(key: string) {
    return this.run(['GET', key], () => this.memory.get(key));
  }

  mget(keys: readonly string[]) {
    return this.run(['MGET', ...keys], () => this.memory.mget(keys));
  }

  set(key: string, value: string, options: DragonflySetOptions = {}) {
    return this.run(
      [
        'SET',
        key,
        value,
        ...(options.nx ? ['NX'] : []),
        ...(options.px ? ['PX', String(options.px)] : []),
      ],
      () => this.memory.set(key, value, options)
    );
  }

  incr(key: string) {
    return this.run(['INCR', key], () => this.memory.incr(key));
  }

  pexpire(key: string, px: number) {
    return this.run(['PEXPIRE', key, String(px)], () =>
      this.memory.pexpire(key, px)
    );
  }

  del(keys: readonly string[]) {
    return this.run(['DEL', ...keys], () => this.memory.del(keys));
  }

  async probe(key: string, value: string, px: number) {
    const written = await this.run(['SET', key, value, 'PX', String(px)], () =>
      this.memory.set(key, value, { px })
    );

    return written.ok && written.value;
  }

  async close() {
    return;
  }

  private async run<T>(
    command: string[],
    apply: () => Promise<DragonflyReply<T>>
  ): Promise<DragonflyReply<T>> {
    if (this.isDown) {
      return UNAVAILABLE_REPLY;
    }

    this.commands.push(command);

    if (this.stallMs) {
      const ms = this.stallMs;
      await new Promise(resolve => setTimeout(resolve, ms));
    }

    if (this.rejecting.delete(command[0])) {
      return REJECTED_REPLY;
    }

    const reply = await apply();
    this.unreachableSince = undefined;

    return reply;
  }
}
