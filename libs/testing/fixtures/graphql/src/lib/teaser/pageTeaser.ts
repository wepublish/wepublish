import {Exact, PageTeaser} from '@wepublish/website/api'
import {image} from '../image/image'

export const pageTeaser: Exact<PageTeaser> = {
  __typename: 'PageTeaser',
  style: 'DEFAULT',
  image,
  preTitle: 'Pre Title',
  title: 'Title',
  lead: 'Lead',
  page: {
    id: 'cl95fumlq261901phgrctx4mz',
    title: 'Title on the page',
    description: 'Description on the page',
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
