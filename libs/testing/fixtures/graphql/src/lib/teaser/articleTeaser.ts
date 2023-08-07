import {ArticleTeaser, Exact} from '@wepublish/website/api'
import {image} from '../image/image'

export const articleTeaser: Exact<ArticleTeaser> = {
  __typename: 'ArticleTeaser',
  style: 'DEFAULT',
  image,
  preTitle: 'Pre Title',
  title: 'Title',
  lead: 'Lead',
  article: {
    id: 'clg2cxnig57497901rej8i9ubj1',
    title: 'Title on the article',
    preTitle: 'Pre Title on the article',
    lead: 'Lead on the article',
    url: 'https://example.com',
    blocks: [
      {
        __typename: 'TitleBlock',
        title: 'Title from block',
        lead: 'Lead from block'
      },
      {
        __typename: 'ImageBlock',
        caption: null,
        image
      }
    ]
  }
}
