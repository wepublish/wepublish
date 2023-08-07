import {faker} from '@faker-js/faker'
import {Exact, FullAuthorFragment} from '@wepublish/website/api'
import {image} from '../image/image'

export const author: Exact<FullAuthorFragment> = {
  __typename: 'Author',
  id: faker.string.uuid(),
  slug: faker.lorem.slug(),
  name: faker.person.fullName(),
  jobTitle: faker.person.jobTitle(),
  createdAt: faker.date.past().toISOString(),
  modifiedAt: faker.date.past().toISOString(),
  url: faker.internet.url(),
  bio: [
    {
      type: 'paragraph',
      children: [
        {
          text: faker.person.bio()
        }
      ]
    }
  ],
  links: [
    {
      title: 'Twitter',
      url: 'https://twitter.com',
      __typename: 'AuthorLink'
    },
    {
      title: 'Facebook',
      url: 'https://facebook.com',
      __typename: 'AuthorLink'
    },
    {
      title: 'Instagram',
      url: 'https://instagram.com',
      __typename: 'AuthorLink'
    }
  ],
  image
}
