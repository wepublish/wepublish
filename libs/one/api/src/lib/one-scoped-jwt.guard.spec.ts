import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { OneScopedJwtGuard } from './one-scoped-jwt.guard';

jest.mock('@nestjs/graphql', () => {
  const original = jest.requireActual('@nestjs/graphql');

  return { ...original, GqlExecutionContext: { create: jest.fn() } };
});

describe('OneScopedJwtGuard', () => {
  const context = {
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
  let reflector: Reflector;
  let verifier: { verifyScopedJWT: jest.Mock };
  let guard: OneScopedJwtGuard;

  function withAuthorizationHeader(authorization?: string) {
    (GqlExecutionContext.create as unknown as jest.Mock).mockReturnValue({
      getContext: () => ({ req: { headers: { authorization } } }),
    });
  }

  beforeEach(() => {
    reflector = new Reflector();
    verifier = { verifyScopedJWT: jest.fn().mockResolvedValue(true) };
    guard = new OneScopedJwtGuard(reflector, verifier);
  });

  it('denies when no scope is declared on the handler', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    withAuthorizationHeader('Bearer token');

    await expect(guard.canActivate(context)).resolves.toBe(false);
  });

  it('denies when the Authorization header is missing', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('read:content');
    withAuthorizationHeader(undefined);

    await expect(guard.canActivate(context)).resolves.toBe(false);
  });

  it('denies a non-bearer Authorization header', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('read:content');
    withAuthorizationHeader('Basic dXNlcjpwYXNz');

    await expect(guard.canActivate(context)).resolves.toBe(false);
    expect(verifier.verifyScopedJWT).not.toHaveBeenCalled();
  });

  it('passes the bearer token and the required scope to the verifier', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('read:content');
    withAuthorizationHeader('Bearer abc.def.ghi');

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(verifier.verifyScopedJWT).toHaveBeenCalledWith(
      'abc.def.ghi',
      'read:content'
    );
  });

  it('denies when the verifier rejects the token', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('read:content');
    withAuthorizationHeader('Bearer abc.def.ghi');
    verifier.verifyScopedJWT.mockResolvedValue(false);

    await expect(guard.canActivate(context)).resolves.toBe(false);
  });
});
