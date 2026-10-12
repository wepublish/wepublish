const sizeOf = (key: unknown, value: unknown) =>
  String(key).length + (typeof value === 'string' ? value.length : 0);

export class LruMap<K, V> extends Map<K, V> {
  bytes = 0;

  constructor(
    readonly maxSize: number,
    readonly maxBytes = Number.POSITIVE_INFINITY
  ) {
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
    this.delete(key);

    const size = sizeOf(key, value);

    if (size > this.maxBytes) {
      return this;
    }

    super.set(key, value);
    this.bytes += size;

    while (this.size > this.maxSize || this.bytes > this.maxBytes) {
      this.delete(super.keys().next().value as K);
    }

    return this;
  }

  override delete(key: K): boolean {
    if (!super.has(key)) {
      return false;
    }

    this.bytes -= sizeOf(key, super.get(key));

    return super.delete(key);
  }

  override clear(): void {
    super.clear();
    this.bytes = 0;
  }
}
