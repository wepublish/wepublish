import {BuilderTeaserProps, Teaser} from '@wepublish/website'

import {SingleTeaser} from './single-teaser'

export const BabanewsTeaser = (props: BuilderTeaserProps) => {
  if (!props.numColumns) {
    return <SingleTeaser {...props} />
  }

  return <Teaser {...props} />
}
