import { ONE_OF_METADATA_KEY } from '@wepublish/nest-modules';
import { MediumStatsResolver } from './medium-stats.resolver';
import {
  ONE_SCOPED_JWT_METADATA_KEY,
  OneScopedJwtGuard,
} from './one-scoped-jwt.guard';

describe('MediumStatsResolver authorisation wiring', () => {
  const handler = MediumStatsResolver.prototype.getMediumStats;

  it('declares the read:stats scope on the handler', () => {
    const scope = Reflect.getMetadata(ONE_SCOPED_JWT_METADATA_KEY, handler);

    expect(scope).toBe('read:stats');
  });

  it('registers the One guard so the global OneOfGuard runs it', () => {
    const guards = Reflect.getMetadata(ONE_OF_METADATA_KEY, handler);

    expect(guards).toContain(OneScopedJwtGuard);
  });

  it('is not marked public', () => {
    const isPublic = Reflect.getMetadata('public', handler);

    expect(isPublic).toBeFalsy();
  });
});
