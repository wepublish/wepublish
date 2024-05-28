import {Type} from '@nestjs/common'
import {Inject} from '@nestjs/common'
import DataLoader from 'dataloader'

export interface Primeable<T> {
  prime: DataLoader<string, T | null>['prime']
  load: DataLoader<string, T | null>['load']
  loadMany: DataLoader<string, T | null>['loadMany']
}

export function PrimeDataLoader<T extends Primeable<unknown>>(dataloader: Type<T>) {
  const decoratorFactory = (
    target: object,
    propertyKey: unknown,
    descriptor: PropertyDescriptor
  ) => {
    const origin = descriptor.value
    const injectDataloader = Inject(dataloader)
    injectDataloader(target, `__DATALOADER__${dataloader.name}`)

    descriptor.value = async function (...args: unknown[]) {
      const resultItem = await origin.apply(this, args)

      if (!resultItem) {
        return resultItem
      }

      const results = Array.isArray(resultItem)
        ? resultItem
        : Array.isArray(resultItem.nodes)
        ? resultItem.nodes
        : [resultItem]

      console.log({results})
      for (const result of results) {
        if ('id' in result) {
          const that = this as any
          const loader = that[`__DATALOADER__${dataloader.name}`] as T
          console.log({loader})
          loader.prime(result.id, result)
        }
      }

      return resultItem
    }
  }

  decoratorFactory.KEY = `PrimeDataLoader_${dataloader.name}`

  return decoratorFactory
}
