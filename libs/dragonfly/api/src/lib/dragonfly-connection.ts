import { type DragonflyReply } from './dragonfly-reply';

export type DragonflySetOptions = { px?: number; nx?: boolean };

export abstract class DragonflyConnection {
  abstract readonly shared: boolean;
  abstract isAvailable(): boolean;
  abstract outageSince(): number | undefined;
  abstract get(key: string): Promise<DragonflyReply<string | null>>;
  abstract mget(
    keys: readonly string[]
  ): Promise<DragonflyReply<Array<string | null>>>;
  abstract set(
    key: string,
    value: string,
    options?: DragonflySetOptions
  ): Promise<DragonflyReply<boolean>>;
  abstract incr(key: string): Promise<DragonflyReply<number>>;
  abstract pexpire(key: string, px: number): Promise<DragonflyReply<boolean>>;
  abstract del(keys: readonly string[]): Promise<DragonflyReply<number>>;
  abstract probe(key: string, value: string, px: number): Promise<boolean>;
  abstract close(): Promise<void>;
}
