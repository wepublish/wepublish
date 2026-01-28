import { applyDecorators, SetMetadata } from '@nestjs/common';
import { PublicGuard } from './public.guard';
import { OneOf } from '@wepublish/nest-modules';

export const PUBLIC_METADATA_KEY = 'public';

/**
 * Causes the method/class to be blocked in case not public.
 * This uses the `OneOf` decorator, so if there are multiple guards attached, only one has to return true.
 */
export const Public = () =>
  applyDecorators(SetMetadata(PUBLIC_METADATA_KEY, true), OneOf(PublicGuard));
