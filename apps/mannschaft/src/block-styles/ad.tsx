import {
  ApiV1,
  BuilderTeaserListBlockProps,
  hasBlockStyle,
  isTeaserListBlock,
  useWebsiteBuilder
} from '@wepublish/website'
import {allPass, compose, insert} from 'ramda'

const first = hasBlockStyle('1st Teaser Ad')
const second = hasBlockStyle('2nd Teaser Ad')
const third = hasBlockStyle('3rd Teaser Ad')

export const isFirstAdTeaser = (block: ApiV1.Block): block is ApiV1.TeaserListBlock =>
  allPass([first, isTeaserListBlock])(block)

export const isSecondAdTeaser = (block: ApiV1.Block): block is ApiV1.TeaserListBlock =>
  allPass([second, isTeaserListBlock])(block)

export const isThirdAdTeaser = (block: ApiV1.Block): block is ApiV1.TeaserListBlock =>
  allPass([third, isTeaserListBlock])(block)

export const AdTeaserBlockStyle = (props: BuilderTeaserListBlockProps) => {
  const {
    blocks: {TeaserList}
  } = useWebsiteBuilder()

  // prettier-ignore
  const position = first(props)
    ? 0
    : second(props)
      ? 1
      : 2

  const teasers = compose(
    insert<ApiV1.Teaser>(position, {
      __typename: 'CustomTeaser',
      properties: [],
      contentUrl: null,
      preTitle: 'ad',
      title: props.title,
      lead: null,
      image: null,
      style: ApiV1.TeaserStyle.Default
    } as ApiV1.CustomTeaser)
  )(props.teasers as ApiV1.Teaser[])

  return <TeaserList {...props} teasers={teasers} title={null} />
}
