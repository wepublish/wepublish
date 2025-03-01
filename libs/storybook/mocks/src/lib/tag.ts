import {FullTagFragment, TagType} from '@wepublish/website/api'
import nanoid from 'nanoid'

export const mockTag = ({main = false}: Partial<FullTagFragment> = {}): FullTagFragment => ({
  id: nanoid(),
  tag: 'Concert',
  main,
  url: 'https://example.com',
  __typename: 'Tag',
  type: TagType.Article
})
