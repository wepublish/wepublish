import {
  type DecimalCodec,
  deserializeCacheValueIfPossible,
  serializeCacheValueIfPossible,
} from '../kv-ttl-cache-serializer';

export interface KvCodec {
  encode(value: unknown): string | undefined;
  decode<T>(text: string): T | undefined;
}

export const KV_CODEC = Symbol('KV_CODEC');

export function createKvCodec(decimal?: DecimalCodec): KvCodec {
  return {
    encode: value => serializeCacheValueIfPossible(value, decimal),
    decode: <T>(text: string) =>
      deserializeCacheValueIfPossible<T>(text, decimal),
  };
}
