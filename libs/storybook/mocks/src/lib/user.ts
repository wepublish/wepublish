import { SensitiveDataUser, User, UserAddress } from '@wepublish/website/api';
import { mockImage } from './image';
import { faker } from '@faker-js/faker';

type UserExtensionProperties = {
  birthday?: string;
  email?: string;
  permissions?: string[];
  address?: Partial<UserAddress>;
  paymentProviderCustomers?: any[];
};

export const mockUser = ({
  id = faker.string.nanoid(),
  name = 'Müller',
  image = mockImage(),
  birthday = '1990-06-15T00:00:00.000Z',
  email = 'mock@example.com',
  firstName = 'Anna',
  flair = 'Software Engineer',
  permissions = [],
  address = mockUserAdress(),
  properties = [],
  paymentProviderCustomers = [],
  active = true,
  roleIDs = [],
}: Partial<User> & UserExtensionProperties = {}): User &
  UserExtensionProperties => ({
  __typename: 'User',
  id,
  name,
  email,
  permissions,
  properties,
  address,
  birthday,
  firstName,
  flair,
  image,
  paymentProviderCustomers,
  active,
  roleIDs,
});

export const mockSensitiveDataUser = ({
  id = faker.string.nanoid(),
  name = 'Müller',
  image = mockImage(),
  birthday = '1990-06-15T00:00:00.000Z',
  email = 'mock@example.com',
  firstName = 'Anna',
  flair = 'Software Engineer',
  permissions = [],
  address = mockUserAdress(),
  properties = [],
  paymentProviderCustomers = [],
  active = true,
  roleIDs = [],
}: Partial<SensitiveDataUser> &
  UserExtensionProperties = {}): SensitiveDataUser &
  UserExtensionProperties => ({
  __typename: 'SensitiveDataUser',
  id,
  name,
  email,
  permissions,
  properties,
  address,
  birthday,
  firstName,
  flair,
  image,
  paymentProviderCustomers,
  active,
  roleIDs,
});

export const mockUserAdress = ({
  streetAddress = 'Musterstrasse 1',
  streetAddress2 = 'c/o Beispiel AG',
  city = 'Zürich',
  zipCode = '8001',
  country = 'Schweiz',
  company = 'Beispiel AG',
}: Partial<UserAddress> = {}): UserAddress => ({
  __typename: 'UserAddress',
  streetAddress,
  streetAddress2,
  company,
  city,
  zipCode,
  country,
});
