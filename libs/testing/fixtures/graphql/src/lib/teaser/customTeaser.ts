import {faker} from '@faker-js/faker'
import {CustomTeaser, Exact, TeaserStyle} from '@wepublish/website/api'
import {image} from '../image/image'

export const customTeaser: Exact<CustomTeaser> = {
  style: TeaserStyle.Default,
  image,
  title: faker.lorem.words(3),
  preTitle: faker.lorem.words(3),
  lead: faker.lorem.words(3),
  contentUrl: faker.internet.url(),
  properties: [],
  __typename: 'CustomTeaser'
}
