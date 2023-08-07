import {faker} from '@faker-js/faker'
import {Exact, Page, PageTeaser, TeaserStyle} from '@wepublish/website/api'
import {image} from '../image/image'

export const pageTeaser: Exact<PageTeaser> = {
  __typename: 'PageTeaser',
  style: TeaserStyle.Default,
  image,
  preTitle: faker.lorem.words(2),
  title: faker.lorem.words(3),
  lead: 'Lead',
  page: {
    id: faker.string.uuid(),
    title: faker.lorem.words(3),
    description: faker.lorem.words(10),
    url: faker.internet.url(),
    blocks: [
      {
        __typename: 'TitleBlock',
        title: faker.lorem.words(3),
        lead: faker.lorem.words(3)
      },
      {
        __typename: 'ImageBlock',
        caption: null,
        image
      }
    ]
  } as Page
}
