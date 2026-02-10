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
  name = faker.person.lastName(),
  image = mockImage(),
  birthday = faker.date
    .past({
      years: 18,
    })
    .toISOString(),
  email = faker.internet.email(),
  firstName = faker.person.firstName(),
  flair = faker.person.jobTitle(),
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
  name = faker.person.lastName(),
  image = mockImage(),
  birthday = faker.date
    .past({
      years: 18,
    })
    .toISOString(),
  email = faker.internet.email(),
  firstName = faker.person.firstName(),
  flair = faker.person.jobTitle(),
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
  streetAddress = faker.location.streetAddress(),
  streetAddress2 = faker.location.secondaryAddress(),
  city = faker.location.city(),
  zipCode = faker.location.zipCode(),
  country = faker.location.country(),
  company = faker.company.name(),
}: Partial<UserAddress> = {}): UserAddress => ({
  __typename: 'UserAddress',
  streetAddress,
  streetAddress2,
  company,
  city,
  zipCode,
  country,
});
