import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { ONE_OF_METADATA_KEY } from '@wepublish/nest-modules';
import type { Mock } from 'vitest';
import { Feature } from './feature.decorator';
import { FeatureGuard } from './feature.guard';
import { FeaturesService } from './features.service';

class Resolver {
  @Feature('newsletter')
  gated() {
    return true;
  }

  @Feature('newsletter', 'print-export')
  doublyGated() {
    return true;
  }

  open() {
    return true;
  }
}

@Feature('newsletter')
class GatedResolver {
  anything() {
    return true;
  }
}

const contextFor = (
  target: { prototype: object },
  method: string
): ExecutionContext =>
  ({
    getHandler: () => (target.prototype as Record<string, unknown>)[method],
    getClass: () => target,
  }) as unknown as ExecutionContext;

describe('FeatureGuard', () => {
  let features: { isEnabled: Mock };
  let guard: FeatureGuard;

  beforeEach(() => {
    features = { isEnabled: vi.fn().mockResolvedValue(false) };
    guard = new FeatureGuard(
      new Reflector(),
      features as unknown as FeaturesService
    );
  });

  it('lets a call through that needs no feature', async () => {
    await expect(guard.canActivate(contextFor(Resolver, 'open'))).resolves.toBe(
      true
    );
  });

  it('lets a call through when its feature is on', async () => {
    features.isEnabled.mockResolvedValue(true);

    await expect(
      guard.canActivate(contextFor(Resolver, 'gated'))
    ).resolves.toBe(true);
    expect(features.isEnabled).toHaveBeenCalledWith('newsletter');
  });

  it('refuses a call whose feature is off, naming the feature', async () => {
    await expect(
      guard.canActivate(contextFor(Resolver, 'gated'))
    ).rejects.toThrow(
      new ForbiddenException(
        'Feature "newsletter" is not enabled for this medium'
      )
    );
  });

  it('needs every feature when several are named', async () => {
    features.isEnabled.mockImplementation(
      async (feature: string) => feature === 'newsletter'
    );

    await expect(
      guard.canActivate(contextFor(Resolver, 'doublyGated'))
    ).rejects.toThrow(/print-export/);
  });

  it('applies a feature set on the class to all its methods', async () => {
    await expect(
      guard.canActivate(contextFor(GatedResolver, 'anything'))
    ).rejects.toThrow(ForbiddenException);
  });

  it('is required on top of the other guards, never one of them', () => {
    const handler = Resolver.prototype.gated;

    expect(Reflect.getMetadata(ONE_OF_METADATA_KEY, handler)).toBeUndefined();
    expect(Reflect.getMetadata(GUARDS_METADATA, handler)).toContain(
      FeatureGuard
    );
  });
});
