import { PermissionsGuard } from './permission.guard';
import { TestingModule, Test } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_METADATA_KEY } from './permission.decorator';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Permission } from '@wepublish/permissions';

jest.mock('@nestjs/graphql', () => {
  const original = jest.requireActual('@nestjs/graphql');

  return {
    ...original,
    GqlExecutionContext: {
      create: jest.fn(),
    },
  };
});

const mockPermission: Permission = {
  id: 'Foo',
  description: 'Foobar',
  deprecated: false,
};

describe('PermissionsGuard', () => {
  let reflector: Reflector;
  let guard: PermissionsGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [],
      providers: [PermissionsGuard],
    }).compile();

    guard = module.get<PermissionsGuard>(PermissionsGuard);
    reflector = module.get<Reflector>(Reflector);

    const mockedCreate = jest.fn().mockImplementation(() => ({
      getContext: jest.fn().mockReturnValue({
        req: {
          user: {
            roles: [{ permissionIDs: [mockPermission.id] }],
          },
        },
      }),
    }));

    GqlExecutionContext.create = mockedCreate;
  });

  it('should return false if no permissions are set', () => {
    const spy = jest.spyOn(reflector, 'getAllAndMerge').mockReturnValue([]);
    const mockContext = {
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any;

    const result = guard.canActivate(mockContext);
    expect(result).toBeFalsy();
    expect(spy).toHaveBeenCalledWith(PERMISSIONS_METADATA_KEY, [{}, {}]);
  });

  it('should return true if the user has the required permissions', () => {
    const spy = jest
      .spyOn(reflector, 'getAllAndMerge')
      .mockReturnValue([mockPermission]);
    const mockContext = {
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any;

    const result = guard.canActivate(mockContext);
    expect(result).toBeTruthy();
    expect(spy).toHaveBeenCalledWith(PERMISSIONS_METADATA_KEY, [{}, {}]);
  });

  it('should return false if the user is not logged in', () => {
    const mockedCreate = jest.fn().mockImplementation(() => ({
      getContext: jest.fn().mockReturnValue({
        req: {
          user: undefined,
        },
      }),
    }));
    GqlExecutionContext.create = mockedCreate;

    const spy = jest
      .spyOn(reflector, 'getAllAndMerge')
      .mockReturnValue([mockPermission]);

    const mockContext = {
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any;

    const result = guard.canActivate(mockContext);
    expect(result).toBeFalsy();
    expect(spy).toHaveBeenCalledWith(PERMISSIONS_METADATA_KEY, [{}, {}]);
  });

  it('should return false if the user does not have the required permissions', () => {
    const spy = jest.spyOn(reflector, 'getAllAndMerge').mockReturnValue([
      {
        id: 'Bar',
        description: 'Barfoo',
        deprecated: false,
      },
    ]);

    const mockContext = {
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any;

    const result = guard.canActivate(mockContext);
    expect(result).toBeFalsy();
    expect(spy).toHaveBeenCalledWith(PERMISSIONS_METADATA_KEY, [{}, {}]);
  });
});
