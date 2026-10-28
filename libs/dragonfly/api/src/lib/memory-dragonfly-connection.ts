import {
  DragonflyConnection,
  type DragonflySetOptions,
} from './dragonfly-connection';
import { type DragonflyReply, REJECTED_REPLY } from './dragonfly-reply';

type MemoryEntry = { value: string; expiresAt?: number };

const answer = <T>(value: T): DragonflyReply<T> => ({ ok: true, value });

export class MemoryDragonflyConnection extends DragonflyConnection {
  readonly shared: boolean = false;
  private entries = new Map<string, MemoryEntry>();

  isAvailable() {
    return true;
  }

  outageSince(): number | undefined {
    return undefined;
  }

  async get(key: string) {
    return answer(this.read(key) ?? null);
  }

  async mget(keys: readonly string[]) {
    return answer(keys.map(key => this.read(key) ?? null));
  }

  async set(key: string, value: string, { px, nx }: DragonflySetOptions = {}) {
    if (nx && this.read(key) !== undefined) {
      return answer(false);
    }

    this.write(key, value, px ? Date.now() + px : undefined);

    return answer(true);
  }

  async incr(key: string): Promise<DragonflyReply<number>> {
    const current = this.read(key);
    const count = Number(current ?? 0) + 1;

    if (!Number.isInteger(count)) {
      return REJECTED_REPLY;
    }

    this.write(key, String(count), this.entries.get(key)?.expiresAt);

    return answer(count);
  }

  async pexpire(key: string, px: number) {
    const value = this.read(key);

    if (value === undefined) {
      return answer(false);
    }

    this.write(key, value, Date.now() + px);

    return answer(true);
  }

  async del(keys: readonly string[]) {
    return answer(
      keys.filter(
        key => this.read(key) !== undefined && this.entries.delete(key)
      ).length
    );
  }

  async probe(key: string, value: string, px: number) {
    const written = await this.set(key, value, { px });

    return written.ok && written.value;
  }

  async close() {
    this.entries.clear();
  }

  private read(key: string) {
    const entry = this.entries.get(key);

    if (entry?.expiresAt !== undefined && entry.expiresAt <= Date.now()) {
      this.entries.delete(key);

      return undefined;
    }

    return entry?.value;
  }

  private write(key: string, value: string, expiresAt: number | undefined) {
    this.entries.set(key, { value, expiresAt });
  }
}
