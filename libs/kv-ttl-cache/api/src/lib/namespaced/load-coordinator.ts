import { Injectable } from '@nestjs/common';

type LoadEntry = { fullKey: string; key: string };

@Injectable()
export class LoadCoordinator {
  private flights = new Map<string, Promise<unknown>>();

  load<T>(
    fullKey: string,
    loader: () => Promise<T>,
    store: (value: T) => Promise<void>
  ): Promise<T> {
    const existing = this.flights.get(fullKey) as Promise<T> | undefined;

    if (existing) {
      return existing;
    }

    const flight = this.track(
      fullKey,
      new Promise<T>(resolve => resolve(loader())),
      store
    );

    return flight;
  }

  loadMany<T>(
    entries: ReadonlyArray<LoadEntry>,
    loader: (keys: string[]) => Promise<Array<T | null>>,
    store: (fullKey: string, value: T) => Promise<void>
  ): Promise<Array<T | null>> {
    const results = new Map<string, Promise<T | null>>();
    const fresh: LoadEntry[] = [];

    const seen = new Set<string>();

    for (const entry of entries) {
      if (seen.has(entry.fullKey)) {
        continue;
      }

      seen.add(entry.fullKey);

      const existing = this.flights.get(entry.fullKey) as
        Promise<T | null> | undefined;

      if (existing) {
        results.set(entry.fullKey, existing);
      } else {
        fresh.push(entry);
      }
    }

    if (fresh.length) {
      const batch = Promise.resolve()
        .then(() => loader(fresh.map(({ key }) => key)))
        .then(loaded => fresh.map((_, index) => loaded[index] ?? null));

      fresh.forEach(({ fullKey }, index) => {
        const flight = this.track(
          fullKey,
          batch.then(values => values[index]),
          value => (value === null ? Promise.resolve() : store(fullKey, value))
        );

        results.set(fullKey, flight);
      });
    }

    return Promise.all(
      entries.map(({ fullKey }) => results.get(fullKey) as Promise<T | null>)
    );
  }

  supersede(fullKeys: readonly string[]): void {
    fullKeys.forEach(fullKey => this.flights.delete(fullKey));
  }

  private track<T>(
    fullKey: string,
    loading: Promise<T>,
    store: (value: T) => Promise<void>
  ): Promise<T> {
    const flight: Promise<T> = loading
      .then(async value => {
        if (this.flights.get(fullKey) === flight) {
          await store(value);
        }

        return value;
      })
      .finally(() => {
        if (this.flights.get(fullKey) === flight) {
          this.flights.delete(fullKey);
        }
      });

    this.flights.set(fullKey, flight);

    return flight;
  }
}
