import { applyDecorators, SetMetadata } from '@nestjs/common';
import { Authenticated } from './authenticated.decorator';

export const FULL_SESSION_METADATA_KEY = 'fullSession';

export const RequiresFullSession = () =>
  applyDecorators(
    Authenticated(),
    SetMetadata(FULL_SESSION_METADATA_KEY, true)
  );
