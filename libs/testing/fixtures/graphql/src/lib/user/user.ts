import {faker} from '@faker-js/faker'
import {image} from '../image/image'
import {Exact, User} from '@wepublish/website/api'

export const user: Exact<User> = {
  __typename: 'User',
  id: faker.string.uuid(),
  name: faker.person.fullName(),
  firstName: faker.person.firstName(),
  email: faker.internet.email(),
  preferredName: faker.person.fullName(),
  address: null,
  flair: 'Flair',
  paymentProviderCustomers: [],
  image,
  properties: [],
  oauth2Accounts: []
}
