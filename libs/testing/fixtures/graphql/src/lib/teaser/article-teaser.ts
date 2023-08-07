import {faker} from '@faker-js/faker'
import {Article, ArticleTeaser, Exact, TeaserStyle} from '@wepublish/website/api'
import {image} from '../image/image'
import {author} from '../author/author'

export const articleTeaser: Exact<ArticleTeaser> = {
  __typename: 'ArticleTeaser',
  style: TeaserStyle.Default,
  image,
  preTitle: faker.lorem.words(2),
  title: faker.lorem.words(3),
  lead: 'Lead',
  article: {
    id: faker.string.uuid(),
    title: faker.lorem.words(3),
    preTitle: faker.lorem.words(3),
    lead: faker.lorem.words(3),
    url: faker.internet.url(),
    authors: [author],
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
  } as Article
}
