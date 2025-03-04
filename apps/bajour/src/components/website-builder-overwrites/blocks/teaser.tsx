import {Teaser} from '@wepublish/block-content/website'
import {BuilderTeaserProps} from '@wepublish/website/builder'

import {ColTeaser} from './col-teaser'
import {SingleTeaser} from './single-teaser'

export const BajourTeaser = (props: BuilderTeaserProps) => {
  if (!props.numColumns) {
    return <Teaser {...props} />
  }

  if (props.numColumns === 1) {
    return <SingleTeaser {...props} />
  }

  return <ColTeaser {...props} />
}
