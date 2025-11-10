import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthenticatedGuard } from './authenticated.guard';
import { AUTHENTICATED_METADATA_KEY } from './authenticated.decorator';

jest.mock('@nestjs/graphql', () => {
  const original = jest.requireActual('@nestjs/graphql');

  return {
    ...original,
    GqlExecutionContext: {
      create: jest.fn(),
    },
  };
});

describe('AuthenticatedGuard', () => {
  let reflector: Reflector;
  let guard: AuthenticatedGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [],
      providers: [AuthenticatedGuard],
    }).compile();

    guard = module.get<AuthenticatedGuard>(AuthenticatedGuard);
    reflector = module.get<Reflector>(Reflector);

    GqlExecutionContext.create = jest.fn().mockImplementation(() => ({
      getContext: jest.fn().mockReturnValue({
        req: {
          user: {},
        },
      }),
    }));
  });

  it('should return true if decorator is not set', () => {
    const spy = jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(false);
    const mockContext = {
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any;

    const result = guard.canActivate(mockContext);
    expect(result).toBeTruthy();
    expect(spy).toHaveBeenCalledWith(AUTHENTICATED_METADATA_KEY, [{}, {}]);
  });

  it('should return true if a user is logged in', () => {
    const spy = jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(true);
    const mockContext = {
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any;

    const result = guard.canActivate(mockContext);
    expect(result).toBeTruthy();
    expect(spy).toHaveBeenCalledWith(AUTHENTICATED_METADATA_KEY, [{}, {}]);
  });

  it('should return false if a user is not logged in', () => {
    GqlExecutionContext.create = jest.fn().mockImplementation(() => ({
      getContext: jest.fn().mockReturnValue({
        req: {
          user: undefined,
        },
      }),
    }));
    const spy = jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(true);
    const mockContext = {
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any;

    const result = guard.canActivate(mockContext);
    expect(result).toBeFalsy();
    expect(spy).toHaveBeenCalledWith(AUTHENTICATED_METADATA_KEY, [{}, {}]);
  });
});
