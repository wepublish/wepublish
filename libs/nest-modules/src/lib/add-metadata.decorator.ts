import {CustomDecorator} from '@nestjs/common'
import {uniq} from 'ramda'

export const AddMetadata = <K = string, V extends unknown[] = []>(
  metadataKey: K,
  metadataValue: V
): CustomDecorator<K> => {
  const decoratorFactory = (target: object, key?: any, descriptor?: any) => {
    const existingValue = Reflect.getMetadata(metadataKey, descriptor?.value ?? target)
    const value = existingValue ? uniq([...existingValue, ...metadataValue]) : metadataValue

    if (descriptor) {
      Reflect.defineMetadata(metadataKey, value, descriptor.value)
      return descriptor
    }

    Reflect.defineMetadata(metadataKey, value, target)
    return target
  }

  decoratorFactory.KEY = metadataKey

  return decoratorFactory
}
