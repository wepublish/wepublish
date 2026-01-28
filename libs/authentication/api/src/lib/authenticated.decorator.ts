import { applyDecorators, SetMetadata } from '@nestjs/common';
import { OneOf } from '@wepublish/nest-modules';
import { AuthenticatedGuard } from './authenticated.guard';

export const AUTHENTICATED_METADATA_KEY = 'authenticated';

/**
 * Causes the method/class to require authenticated user.
 * This uses the `OneOf` decorator, so if there are multiple guards attached, only one has to return true.
 */
export const Authenticated = () =>
  applyDecorators(
    SetMetadata(AUTHENTICATED_METADATA_KEY, true),
    OneOf(AuthenticatedGuard)
  );
