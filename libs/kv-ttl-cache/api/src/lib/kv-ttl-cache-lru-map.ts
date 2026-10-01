export class LruMap<K, V> extends Map<K, V> {
  constructor(readonly maxSize: number) {
    super();
  }

  override get(key: K): V | undefined {
    if (!super.has(key)) {
      return undefined;
    }

    const value = super.get(key) as V;
    super.delete(key);
    super.set(key, value);

    return value;
  }

  override set(key: K, value: V): this {
    super.delete(key);
    super.set(key, value);

    while (this.size > this.maxSize) {
      super.delete(super.keys().next().value as K);
    }

    return this;
  }
}
