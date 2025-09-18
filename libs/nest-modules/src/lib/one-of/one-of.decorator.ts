import { CanActivate, Type } from '@nestjs/common';
import { AddMetadata } from '../add-metadata.decorator';

export const ONE_OF_METADATA_KEY = 'one_of';

/**
 * Adds guards to the metadata so that the OneOfGuard knows which guards to check.
 */
export const OneOf = (...guards: Type<CanActivate>[]) =>
  AddMetadata(ONE_OF_METADATA_KEY, guards);
