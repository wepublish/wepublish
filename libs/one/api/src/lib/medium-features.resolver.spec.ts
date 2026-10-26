import { ONE_OF_METADATA_KEY } from '@wepublish/nest-modules';
import type { FeaturesService } from '@wepublish/features/api';
import type { Mock } from 'vitest';
import { MediumFeaturesResolver } from './medium-features.resolver';
import {
  ONE_SCOPED_JWT_METADATA_KEY,
  OneScopedJwtGuard,
} from './one-scoped-jwt.guard';

describe('MediumFeaturesResolver', () => {
  let features: { apply: Mock; enabledKeys: Mock };
  let resolver: MediumFeaturesResolver;

  beforeEach(() => {
    features = {
      apply: vi.fn().mockResolvedValue(undefined),
      enabledKeys: vi.fn().mockResolvedValue(['newsletter']),
    };
    resolver = new MediumFeaturesResolver(
      features as unknown as FeaturesService
    );
  });

  const handler = MediumFeaturesResolver.prototype.applyMediumFeatures;

  it('demands the write:features scope', () => {
    expect(Reflect.getMetadata(ONE_SCOPED_JWT_METADATA_KEY, handler)).toBe(
      'write:features'
    );
  });

  it('runs the One channel guard', () => {
    expect(Reflect.getMetadata(ONE_OF_METADATA_KEY, handler)).toContain(
      OneScopedJwtGuard
    );
  });

  it('is not public', () => {
    expect(Reflect.getMetadata('public', handler)).toBeFalsy();
  });

  it('stores the state One pushes and answers with what is now on', async () => {
    await expect(
      resolver.applyMediumFeatures({ newsletter: true, other: false })
    ).resolves.toEqual(['newsletter']);

    expect(features.apply).toHaveBeenCalledWith({
      newsletter: true,
      other: false,
    });
  });
});
