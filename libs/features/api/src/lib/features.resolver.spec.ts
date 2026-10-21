import { Reflector } from '@nestjs/core';
import { AUTHENTICATED_METADATA_KEY } from '@wepublish/authentication/api';
import type { Mock } from 'vitest';
import { FeaturesResolver } from './features.resolver';
import { FeaturesService } from './features.service';

describe('FeaturesResolver', () => {
  let features: { enabledKeys: Mock };
  let resolver: FeaturesResolver;

  beforeEach(() => {
    features = { enabledKeys: vi.fn().mockResolvedValue(['newsletter']) };
    resolver = new FeaturesResolver(features as unknown as FeaturesService);
  });

  it('lists the features switched on for this medium', async () => {
    await expect(resolver.features()).resolves.toEqual(['newsletter']);
  });

  it('is only answered for a logged in user', () => {
    expect(
      new Reflector().get(
        AUTHENTICATED_METADATA_KEY,
        FeaturesResolver.prototype.features
      )
    ).toBe(true);
  });
});
