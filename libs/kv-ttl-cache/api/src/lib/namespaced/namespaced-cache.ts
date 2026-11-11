export abstract class NamespacedCache {
  abstract getOrLoadNs<T>(
    namespace: string,
    key: string,
    loader: () => Promise<T> | T,
    ttlSeconds: number
  ): Promise<T>;

  abstract getOrLoadManyNs<T>(
    namespace: string,
    keys: string[],
    loader: (missing: string[]) => Promise<Array<T | null>>,
    ttlSeconds: number,
    keyPrefix?: string
  ): Promise<Array<T | null>>;

  abstract getNs<T>(namespace: string, key: string): Promise<T | undefined>;

  abstract setNs<T>(
    namespace: string,
    key: string,
    value: T,
    ttlSeconds: number
  ): Promise<void>;

  abstract delNs(namespace: string, key: string): Promise<void>;
}
