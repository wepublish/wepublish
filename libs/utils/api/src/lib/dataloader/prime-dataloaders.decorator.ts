import { Type } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import DataLoader from 'dataloader';

export interface Primeable<T> {
  prime: DataLoader<string, T | null>['prime'];
  load: DataLoader<string, T | null>['load'];
  loadMany: DataLoader<string, T | null>['loadMany'];
}

export function PrimeDataLoader<T extends Primeable<unknown>>(
  dataloader: Type<T>,
  primeKey = 'id'
) {
  const decoratorFactory = (
    target: object,
    propertyKey: unknown,
    descriptor: PropertyDescriptor
  ) => {
    const origin = descriptor.value;
    const injectProperty = `__DATALOADER__${dataloader.name}`;
    const injectDataloader = Inject(dataloader);
    injectDataloader(target, injectProperty);

    descriptor.value = async function (...args: unknown[]) {
      const resultItem = await origin.apply(this, args);

      if (!resultItem) {
        return resultItem;
      }

      const results =
        Array.isArray(resultItem) ? resultItem.flat()
        : Array.isArray(resultItem.nodes) ? resultItem.nodes
        : [resultItem];

      for (const result of results) {
        if (primeKey in result) {
          const that = this as any;
          const loader = that[injectProperty] as T;
          loader.prime(result[primeKey], result);
        }
      }

      return resultItem;
    };
  };

  decoratorFactory.KEY = `PrimeDataLoader_${dataloader.name}`;

  return decoratorFactory;
}
