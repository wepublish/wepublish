import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthenticatedGuard } from './authenticated.guard';
import { AUTHENTICATED_METADATA_KEY } from './authenticated.decorator';

vi.mock('@nestjs/graphql', async () => {
  const original = await vi.importActual('@nestjs/graphql');

  return {
    ...original,
    GqlExecutionContext: {
      create: vi.fn(),
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

    GqlExecutionContext.create = vi.fn().mockImplementation(() => ({
      getContext: vi.fn().mockReturnValue({
        req: {
          user: {},
        },
      }),
    }));
  });

  it('should return true if decorator is not set', () => {
    const spy = vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const mockContext = {
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any;

    const result = guard.canActivate(mockContext);
    expect(result).toBeTruthy();
    expect(spy).toHaveBeenCalledWith(AUTHENTICATED_METADATA_KEY, [{}, {}]);
  });

  it('should return true if a user is logged in', () => {
    const spy = vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const mockContext = {
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any;

    const result = guard.canActivate(mockContext);
    expect(result).toBeTruthy();
    expect(spy).toHaveBeenCalledWith(AUTHENTICATED_METADATA_KEY, [{}, {}]);
  });

  it('should return false if a user is not logged in', () => {
    GqlExecutionContext.create = vi.fn().mockImplementation(() => ({
      getContext: vi.fn().mockReturnValue({
        req: {
          user: undefined,
        },
      }),
    }));
    const spy = vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const mockContext = {
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any;

    const result = guard.canActivate(mockContext);
    expect(result).toBeFalsy();
    expect(spy).toHaveBeenCalledWith(AUTHENTICATED_METADATA_KEY, [{}, {}]);
  });
});
