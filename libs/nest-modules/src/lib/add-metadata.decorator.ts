import { CustomDecorator } from '@nestjs/common';
import { uniq } from 'ramda';

/**
 * Unlike the existing decorator SetMetadata, this decorator does not override already existing metadata but appends to it.
 * This allows to have multiple decorators adding to the same metadata key.
 *
 * This is based on the existing SetMetadata decorator by [@nestjs/common](https://github.com/nestjs/nest/blob/302f08dc5298b671fe106cd4ff7cef3cbdf70c6e/packages/common/decorators/core/set-metadata.decorator.ts)
 */
export const AddMetadata = <K = string, V extends unknown[] = []>(
  metadataKey: K,
  metadataValue: V
): CustomDecorator<K> => {
  const decoratorFactory = (target: object, key?: any, descriptor?: any) => {
    const existingValue = Reflect.getMetadata(
      metadataKey,
      descriptor?.value ?? target
    );
    const value =
      existingValue ?
        uniq([...existingValue, ...metadataValue])
      : metadataValue;

    if (descriptor) {
      Reflect.defineMetadata(metadataKey, value, descriptor.value);
      return descriptor;
    }

    Reflect.defineMetadata(metadataKey, value, target);
    return target;
  };

  decoratorFactory.KEY = metadataKey;

  return decoratorFactory;
};
