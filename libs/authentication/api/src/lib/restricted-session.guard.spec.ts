import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthSessionType } from './auth-session';
import { Authenticated } from './authenticated.decorator';
import { Public } from './public.decorator';
import { AllowsRestrictedSession } from './restricted-session.decorator';
import { RestrictedSessionGuard } from './restricted-session.guard';
import { SESSION_RESTRICTED } from './session-restriction';

class Handlers {
  @Public()
  open() {
    return true;
  }

  @Authenticated()
  account() {
    return true;
  }

  @AllowsRestrictedSession()
  @Authenticated()
  setup() {
    return true;
  }

  undecorated() {
    return true;
  }
}

@Public()
class OpenController {
  anything() {
    return true;
  }
}

const restricted = { type: AuthSessionType.User, restricted: true };
const full = { type: AuthSessionType.User, restricted: false };

const graphql = (
  handler: () => void,
  user: unknown,
  cls: object = Handlers
): ExecutionContext =>
  ({
    getType: () => 'graphql',
    getHandler: () => handler,
    getClass: () => cls,
    // GqlExecutionContext reads the fourth resolver argument as the context.
    getArgs: () => [{}, {}, { req: { user } }, {}],
  }) as unknown as ExecutionContext;

const http = (
  handler: () => void,
  request: (() => unknown) | { user?: unknown },
  cls: object = Handlers
): ExecutionContext =>
  ({
    getType: () => 'http',
    getHandler: () => handler,
    getClass: () => cls,
    switchToHttp: () => ({
      getRequest: typeof request === 'function' ? request : () => request,
    }),
  }) as unknown as ExecutionContext;

describe('RestrictedSessionGuard', () => {
  const guard = new RestrictedSessionGuard(new Reflector());
  const { open, account, setup, undecorated } = Handlers.prototype;

  it('denies a restricted session on a handler nobody marked', () => {
    expect(() => guard.canActivate(graphql(account, restricted))).toThrow(
      new ForbiddenException(SESSION_RESTRICTED)
    );
    expect(() => guard.canActivate(graphql(undecorated, restricted))).toThrow(
      new ForbiddenException(SESSION_RESTRICTED)
    );
  });

  it('lets a restricted session through where the handler allows it', () => {
    expect(guard.canActivate(graphql(setup, restricted))).toBe(true);
  });

  it('lets a restricted session read what is public', () => {
    expect(guard.canActivate(graphql(open, restricted))).toBe(true);
    expect(
      guard.canActivate(
        graphql(OpenController.prototype.anything, restricted, OpenController)
      )
    ).toBe(true);
  });

  it.each([
    ['a full user session', full],
    ['a peering token', { type: AuthSessionType.Token }],
    ['an api key', { type: AuthSessionType.ApiToken }],
    ['nobody', undefined],
  ])('lets %s through everywhere', (_name, session) => {
    expect(guard.canActivate(graphql(account, session))).toBe(true);
  });

  it('answers for a public controller without reading the request', () => {
    const getRequest = vi.fn();

    expect(guard.canActivate(http(open, getRequest))).toBe(true);
    expect(getRequest).not.toHaveBeenCalled();
  });

  it('denies a restricted session on a controller nobody marked', () => {
    expect(() =>
      guard.canActivate(http(account, { user: restricted }))
    ).toThrow(new ForbiddenException(SESSION_RESTRICTED));
  });
});
