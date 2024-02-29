import {ApiV1, BuilderTeaserProps, Teaser} from '@wepublish/website'

import {ColTeaser} from './col-teaser'
import {ColTeaserLight} from './col-teaser-light'
import {ColTeaserText} from './col-teaser-text'
import {SingleTeaser} from './single-teaser'
import {TeaserOverwrite} from './teaser-overwrite'

export const BajourTeaser = (props: BuilderTeaserProps) => {
  if (!props.numColumns) {
    return <Teaser {...props} />
  }

  if (props.numColumns === 1) {
    return <SingleTeaser {...props} />
  }

  if (props.teaser?.style === ApiV1.TeaserStyle.Default) {
    return <ColTeaser {...props} />
  }

  if (props.teaser?.style === ApiV1.TeaserStyle.Light) {
    return <ColTeaserLight {...props} />
  }

  if (props.teaser?.style === ApiV1.TeaserStyle.Text) {
    return <ColTeaserText {...props} />
  }

  return <TeaserOverwrite {...props} />
}
