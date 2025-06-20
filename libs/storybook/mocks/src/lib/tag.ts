import {FullTagFragment, TagType} from '@wepublish/website/api'
import nanoid from 'nanoid'
import {mockRichText} from './richtext'

export const mockTag = ({
  tag = 'Concert',
  main = false,
  description = mockRichText()
}: Partial<FullTagFragment> = {}): FullTagFragment => ({
  __typename: 'Tag',
  id: nanoid(),
  tag,
  description,
  main,
  url: 'https://example.com',
  type: TagType.Article
})
