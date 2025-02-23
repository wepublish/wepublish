import {FullTagFragment} from '@wepublish/website/api'
import nanoid from 'nanoid'

export const mockTag = ({main = false} = {}) =>
  ({
    id: nanoid(),
    tag: 'Concert',
    main,
    url: 'https://example.com',
    __typename: 'Tag'
  } as FullTagFragment)
