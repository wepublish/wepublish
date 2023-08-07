import {CustomTeaser, Exact} from '@wepublish/website/api'
import {image} from '../image/image'

export const customTeaser: Exact<CustomTeaser> = {
  style: 'DEFAULT',
  image,
  preTitle: null,
  title: 'Teambesprechung vom 23.05.',
  lead: 'Lead',
  contentUrl: 'https://example.com',
  properties: [],
  __typename: 'CustomTeaser'
}
