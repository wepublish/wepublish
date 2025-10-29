import { Permission } from '@wepublish/permissions';
import { hasPermission } from './has-permission';

const mockPermission: Permission = {
  id: 'Foo',
  description: 'Foobar',
  deprecated: false,
};

const mockPermission2: Permission = {
  id: 'Bar',
  description: 'Barfoo',
  deprecated: false,
};

it('should return true if permission is present', () => {
  const result = hasPermission(mockPermission, [
    {
      permissionIDs: [mockPermission.id],
    },
    {
      permissionIDs: [],
    },
  ] as any);

  expect(result).toBeTruthy();
});

it('should return false if permission is not present', () => {
  const result = hasPermission(mockPermission, [
    {
      permissionIDs: [],
    },
    {
      permissionIDs: [],
    },
  ] as any);

  expect(result).toBeFalsy();
});

it('should return true if permission is present in one of the roles a user has', () => {
  const result = hasPermission(mockPermission, [
    {
      permissionIDs: [mockPermission2.id],
    },
    {
      permissionIDs: [mockPermission.id],
    },
  ] as any);

  expect(result).toBeTruthy();
});

it('should return true if multiple permissions are present', () => {
  const result = hasPermission([mockPermission, mockPermission2], [
    {
      permissionIDs: [mockPermission.id, mockPermission2.id],
    },
    {
      permissionIDs: [],
    },
  ] as any);

  expect(result).toBeTruthy();
});

it('should return true if the permissions are spread in multiple roles', () => {
  const result = hasPermission([mockPermission, mockPermission2], [
    {
      permissionIDs: [mockPermission2.id],
    },
    {
      permissionIDs: [mockPermission.id],
    },
  ] as any);

  expect(result).toBeTruthy();
});
