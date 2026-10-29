import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { PublicGuard } from './public.guard';
import { PUBLIC_METADATA_KEY } from './public.decorator';

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
  let guard: PublicGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [],
      providers: [PublicGuard],
    }).compile();

    guard = module.get<PublicGuard>(PublicGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should return false if decorator is not set', () => {
    const spy = vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const mockContext = {
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any;

    const result = guard.canActivate(mockContext);
    expect(result).toBeFalsy();
    expect(spy).toHaveBeenCalledWith(PUBLIC_METADATA_KEY, [{}, {}]);
  });

  it('should return true if decorator is set', () => {
    const spy = vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const mockContext = {
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any;

    const result = guard.canActivate(mockContext);
    expect(result).toBeTruthy();
    expect(spy).toHaveBeenCalledWith(PUBLIC_METADATA_KEY, [{}, {}]);
  });
});
