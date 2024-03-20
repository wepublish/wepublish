import {BuilderTeaserProps, Teaser} from '@wepublish/website'

// import {ColTeaser} from './col-teaser'
import {SingleTeaser} from './single-teaser'

export const BabanewsTeaser = (props: BuilderTeaserProps) => {
  if (!props.numColumns) {
    return <SingleTeaser {...props} />
  }

  // if (props.numColumns === 1) {
  //   return <SingleTeaser {...props} />
  // }

  // return <ColTeaser {...props} />
  return <Teaser {...props} />
}
