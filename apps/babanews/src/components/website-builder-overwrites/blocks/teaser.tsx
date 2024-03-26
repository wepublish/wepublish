import {BuilderTeaserProps, Teaser} from '@wepublish/website'

import {ListTeaser} from './list-teaser'

export const BabanewsTeaser = (props: BuilderTeaserProps) => {
  if (!props.numColumns) {
    return <ListTeaser {...props} />
  }

  return <Teaser {...props} />
}
