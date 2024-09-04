import {styled} from '@mui/material'
import {
  ApiV1,
  BuilderTeaserListBlockProps,
  hasBlockStyle,
  isTeaserListBlock,
  TeaserListBlock,
  TeaserListBlockTeasers
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

// This allows the ad slot to not create an empty space when not displayed
const AdTeaserList = styled(TeaserListBlock)`
  ${TeaserListBlockTeasers} {
    ${({theme}) => theme.breakpoints.up('md')} {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  ${TeaserListBlockTeasers} > * {
    grid-column: initial;
    grid-row: initial;

    &:empty {
      display: none;
    }
  }
`

export const AdTeaserBlockStyle = (props: BuilderTeaserListBlockProps) => {
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
      preTitle: 'ad-300',
      title: null,
      lead: null,
      image: null,
      style: ApiV1.TeaserStyle.Default
    } as ApiV1.CustomTeaser)
  )(props.teasers as ApiV1.Teaser[])

  return <AdTeaserList {...props} teasers={teasers} title={null} />
}
