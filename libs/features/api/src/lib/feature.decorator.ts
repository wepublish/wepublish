import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import type { FeatureKey } from '@wepublish/features';
import { FeatureGuard } from './feature.guard';

export const FEATURE_METADATA_KEY = 'feature';

/**
 * Causes the method/class to be callable only when all named features are
 * switched on for this medium.
 * Unlike `@Permissions` or `@Authenticated` this does NOT use `OneOf`: the
 * feature is required in addition to whatever else guards the call.
 */
export const Feature = (...features: FeatureKey[]) =>
  applyDecorators(
    SetMetadata(FEATURE_METADATA_KEY, features),
    UseGuards(FeatureGuard)
  );
