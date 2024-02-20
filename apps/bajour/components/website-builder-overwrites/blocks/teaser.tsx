import {ApiV1, BuilderTeaserProps, Teaser} from '@wepublish/website'

import {BaselBriefing} from '../../bajour/basel-briefing'
import {BestOfWePublish} from '../../bajour/best-of-wepublish'
import {isBaselBriefing} from '../../bajour/is-briefing'
import {ColTeaser} from './col-teaser'
import {ColTeaserLight} from './col-teaser-light'
import {ColTeaserText} from './col-teaser-text'
import {SingleTeaser} from './single-teaser'
import {TeaserOverwrite} from './teaser-overwrite'

export const BajourTeaser = (props: BuilderTeaserProps) => {
  console.log('props', props)
  // if (isBriefing(props)) {
  //   return <BaselBriefing {...props} />
  // }

  // ApiV1.TeaserStyle.Default will be changed to e.g. BestOfWePublish or Archive
  if (
    props.teaser?.__typename === 'PeerArticleTeaser' &&
    props.teaser.style === ApiV1.TeaserStyle.Default
  ) {
    return <BestOfWePublish {...props} />
  }

  if (isBaselBriefing(props)) {
    return <BaselBriefing {...props} />
  }

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
