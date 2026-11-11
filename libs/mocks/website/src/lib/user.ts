import {
  FullAddressFragment,
  FullPaymentProviderCustomerFragment,
  FullSensitiveDataUserFragment,
  FullUserFragment,
} from '@wepublish/website/api';
import { mockImage } from './image';
import { faker } from './faker';
import { definedOnly } from './overrides';

export const mockUserAddress = (
  overrides: Partial<FullAddressFragment> = {}
): FullAddressFragment => ({
  __typename: 'UserAddress',
  company: faker.company.name(),
  streetAddress: faker.location.street(),
  streetAddressNumber: faker.location.buildingNumber(),
  streetAddress2: null,
  streetAddress2Number: null,
  zipCode: faker.location.zipCode(),
  city: faker.location.city(),
  country: faker.location.country(),
  ...definedOnly(overrides),
});

export const mockUserAdress = mockUserAddress;

export const mockPaymentProviderCustomer = (
  overrides: Partial<FullPaymentProviderCustomerFragment> = {}
): FullPaymentProviderCustomerFragment => ({
  __typename: 'PaymentProviderCustomer',
  paymentProviderID: 'stripe',
  customerID: faker.string.nanoid(),
  ...definedOnly(overrides),
});

export const mockUser = ({
  image = mockImage(),
  ...overrides
}: Partial<FullUserFragment> = {}): FullUserFragment => ({
  __typename: 'User',
  id: faker.string.nanoid(),
  name: faker.person.lastName(),
  firstName: faker.person.firstName(),
  flair: faker.person.jobTitle(),
  image,
  properties: [],
  ...definedOnly(overrides),
});

export const mockSensitiveDataUser = ({
  image = mockImage(),
  address = mockUserAddress(),
  ...overrides
}: Partial<FullSensitiveDataUserFragment> = {}): FullSensitiveDataUserFragment => ({
  __typename: 'SensitiveDataUser',
  id: faker.string.nanoid(),
  name: faker.person.lastName(),
  firstName: faker.person.firstName(),
  flair: faker.person.jobTitle(),
  email: faker.internet.email(),
  pendingEmail: null,
  birthday: '1990-01-01T00:00:00.000Z',
  totpEnabled: false,
  permissions: [],
  paymentProviderCustomers: [],
  properties: [],
  image,
  address,
  ...definedOnly(overrides),
});
