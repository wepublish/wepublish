import { applyDecorators, SetMetadata } from '@nestjs/common';
import { OneOf } from '@wepublish/nest-modules';
import {
  ONE_SCOPED_JWT_METADATA_KEY,
  OneScopedJwtGuard,
} from './one-scoped-jwt.guard';

export const OneScopedJwt = (scope: string) =>
  applyDecorators(
    SetMetadata(ONE_SCOPED_JWT_METADATA_KEY, scope),
    OneOf(OneScopedJwtGuard)
  );
