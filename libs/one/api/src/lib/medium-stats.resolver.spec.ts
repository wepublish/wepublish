import { ONE_OF_METADATA_KEY } from '@wepublish/nest-modules';
import { MediumStatsResolver } from './medium-stats.resolver';
import {
  ONE_SCOPED_JWT_METADATA_KEY,
  OneScopedJwtGuard,
} from './one-scoped-jwt.guard';

const OPERATIONS = ['getMediumStats', 'getMediumMigrations'] as const;

describe('MediumStatsResolver authorisation wiring', () => {
  it.each(OPERATIONS)('%s declares the read:stats scope', operation => {
    const handler = MediumStatsResolver.prototype[operation];
    const scope = Reflect.getMetadata(ONE_SCOPED_JWT_METADATA_KEY, handler);

    expect(scope).toBe('read:stats');
  });

  it.each(OPERATIONS)(
    '%s registers the One guard so the global OneOfGuard runs it',
    operation => {
      const handler = MediumStatsResolver.prototype[operation];
      const guards = Reflect.getMetadata(ONE_OF_METADATA_KEY, handler);

      expect(guards).toContain(OneScopedJwtGuard);
    }
  );

  it.each(OPERATIONS)('%s is not marked public', operation => {
    const handler = MediumStatsResolver.prototype[operation];

    expect(Reflect.getMetadata('public', handler)).toBeFalsy();
  });

  it('guards every operation the resolver exposes, with none forgotten', () => {
    const own = Object.getOwnPropertyNames(
      MediumStatsResolver.prototype
    ).filter(
      name =>
        name !== 'constructor' &&
        typeof (MediumStatsResolver.prototype as never)[name] === 'function'
    );

    expect(own.sort()).toEqual([...OPERATIONS].sort());
  });
});
