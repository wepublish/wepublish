import { ONE_OF_METADATA_KEY } from '@wepublish/nest-modules';
import { ImpersonationResolver } from './impersonation.resolver';
import {
  ONE_SCOPED_JWT_METADATA_KEY,
  OneScopedJwtGuard,
} from './one-scoped-jwt.guard';

const OPERATIONS = [
  'getImpersonationEnabled',
  'searchUsers',
  'impersonationSessions',
  'createImpersonationGrant',
  'revokeImpersonationSessions',
] as const;

describe('ImpersonationResolver requires the secure channel', () => {
  it.each(OPERATIONS)('%s demands the write:impersonate scope', operation => {
    const handler = ImpersonationResolver.prototype[operation];
    const scope = Reflect.getMetadata(ONE_SCOPED_JWT_METADATA_KEY, handler);

    expect(scope).toBe('write:impersonate');
  });

  it.each(OPERATIONS)('%s runs the One channel guard', operation => {
    const handler = ImpersonationResolver.prototype[operation];
    const guards = Reflect.getMetadata(ONE_OF_METADATA_KEY, handler);

    expect(guards).toContain(OneScopedJwtGuard);
  });

  it.each(OPERATIONS)('%s is not public', operation => {
    const handler = ImpersonationResolver.prototype[operation];

    expect(Reflect.getMetadata('public', handler)).toBeFalsy();
  });

  it.each(OPERATIONS)(
    '%s does not accept the read-only stats scope',
    operation => {
      const handler = ImpersonationResolver.prototype[operation];
      const scope = Reflect.getMetadata(ONE_SCOPED_JWT_METADATA_KEY, handler);

      expect(scope).not.toBe('read:stats');
      expect(scope).not.toBe('read:content');
    }
  );

  it('guards every operation the resolver exposes, with none forgotten', () => {
    const own = Object.getOwnPropertyNames(
      ImpersonationResolver.prototype
    ).filter(
      name =>
        name !== 'constructor' &&
        name !== 'assertEnabled' &&
        typeof (ImpersonationResolver.prototype as never)[name] === 'function'
    );

    expect(own.sort()).toEqual([...OPERATIONS].sort());

    for (const name of own) {
      const handler = (ImpersonationResolver.prototype as never)[name];
      expect(
        Reflect.getMetadata(ONE_SCOPED_JWT_METADATA_KEY, handler)
      ).toBeDefined();
    }
  });
});

describe('ImpersonationResolver.createImpersonationGrant', () => {
  it('passes the code challenge and a missing reason on to the session service', async () => {
    const previous = process.env['WEP_ONE_IMPERSONATION'];
    delete process.env['WEP_ONE_IMPERSONATION'];
    const sessionService = {
      createImpersonationGrant: vi.fn().mockResolvedValue({ token: 'grant' }),
    };
    const resolver = new ImpersonationResolver(
      sessionService as never,
      {} as never
    );

    await resolver.createImpersonationGrant(
      'support',
      60,
      'ops@wepublish.ch',
      undefined,
      'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM'
    );

    expect(sessionService.createImpersonationGrant).toHaveBeenCalledWith({
      userId: 'support',
      durationMinutes: 60,
      impersonatedBy: 'ops@wepublish.ch',
      reason: undefined,
      codeChallenge: 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
    });
    process.env['WEP_ONE_IMPERSONATION'] = previous;
  });
});
