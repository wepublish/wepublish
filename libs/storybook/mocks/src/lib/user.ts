import { User } from '@wepublish/website/api';
import { mockImage } from './image';
import { faker } from '@faker-js/faker';

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
  address,
  properties = [],
}: Partial<User> = {}): User => ({
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
  paymentProviderCustomers: [],
});
