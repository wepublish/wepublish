import { applyDecorators, SetMetadata } from '@nestjs/common';
import { OneOf } from '@wepublish/nest-modules';
import { ScopedJwtGuard, SCOPED_JWT_METADATA_KEY } from './scoped-jwt.guard';

/**
 * Allows access to the endpoint if the request carries a valid scoped JWT
 * with the specified scope claim.
 * This uses the `OneOf` decorator, so if there are multiple guards attached,
 * only one has to return true.
 */
export const ScopedJwt = (scope: string) =>
  applyDecorators(
    SetMetadata(SCOPED_JWT_METADATA_KEY, scope),
    OneOf(ScopedJwtGuard)
  );
