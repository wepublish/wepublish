import {PeerQuery} from '@wepublish/website/api'
import {image} from '../image/image'
import {faker} from '@faker-js/faker'

export const peer: NonNullable<PeerQuery['peer']> = {
  id: faker.string.uuid(),
  name: faker.commerce.productName(),
  slug: faker.lorem.slug(),
  isDisabled: false,
  hostURL: faker.internet.url(),
  profile: {
    name: 'We.Publish',
    hostURL: faker.internet.url(),
    themeColor: '#000000',
    themeFontColor: '#ffffff',
    logo: image,
    callToActionText: [
      {
        type: 'paragraph',
        children: [
          {
            text: faker.lorem.sentence()
          }
        ]
      }
    ],
    callToActionURL: faker.internet.url(),
    callToActionImage: image,
    callToActionImageURL: faker.internet.url(),
    websiteURL: faker.internet.url(),
    __typename: 'PeerProfile'
  },
  createdAt: faker.date.past().toISOString(),
  modifiedAt: faker.date.past().toISOString(),
  __typename: 'Peer'
}
