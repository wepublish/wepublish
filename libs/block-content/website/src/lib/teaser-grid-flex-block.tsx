import {css, styled} from '@mui/material'
import {useWebsiteBuilder} from '@wepublish/website-builder'
import {
  Block,
  FlexAlignment,
  Teaser as TeaserType,
  TeaserGridFlexBlock as TeaserGridFlexBlockType
} from '@wepublish/website/api'

export const isTeaserGridFlexBlock = (block: Block): block is TeaserGridFlexBlockType =>
  block.__typename === 'TeaserGridFlexBlock'

export const TeaserGridFlexBlockWrapper = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(2)};
  grid-template-columns: 1fr;
  align-items: stretch;

  ${({theme}) => css`
    ${theme.breakpoints.up('sm')} {
      grid-template-columns: 1fr 1fr;
    }

    ${theme.breakpoints.up('md')} {
      grid-template-columns: repeat(12, 1fr);
    }
  `}
`

const TeaserWrapper = styled('article')<FlexAlignment>`
  display: grid;
  gap: ${({theme}) => theme.spacing(1)};
  grid-template-rows: auto;
  grid-auto-rows: max-content;

  ${({theme, h, w, x, y}) => css`
    ${theme.breakpoints.up('md')} {
      grid-column-start: ${x + 1};
      grid-column-end: ${x + 1 + w};
      grid-row-start: ${y + 1};
      grid-row-end: ${y + 1 + h};
    }
  `}
`

type TeaserProps = {
  teaser?: TeaserType | null
  alignment: FlexAlignment
  className?: string
}

const teaserTitle = (teaser: TeaserType) => {
  switch (teaser.__typename) {
    case 'PageTeaser':
      return teaser.title ?? teaser.page?.title
    case 'ArticleTeaser':
      return teaser.title ?? teaser.article?.title
    case 'CustomTeaser':
      return teaser.title
  }
}

const teaserPreTitle = (teaser: TeaserType) => {
  switch (teaser.__typename) {
    case 'PageTeaser':
      return teaser.preTitle
    case 'ArticleTeaser':
      return teaser.preTitle ?? teaser.article?.preTitle
    case 'CustomTeaser':
      return teaser.preTitle
  }
}

const teaserLead = (teaser: TeaserType) => {
  switch (teaser.__typename) {
    case 'PageTeaser':
      return teaser.lead ?? teaser.page?.description
    case 'ArticleTeaser':
      return teaser.lead ?? teaser.article?.lead
    case 'CustomTeaser':
      return teaser.lead
  }
}

const TeaserImage = styled('img')`
  object-fit: cover;
  height: 100%;
`

const TeaserTitleWrapper = styled('header')``

export const Teaser = ({teaser, alignment, className}: TeaserProps) => {
  const title = (teaser && teaserTitle(teaser)) ?? ''
  const preTitle = (teaser && teaserPreTitle(teaser)) ?? ''
  const lead = (teaser && teaserLead(teaser)) ?? ''

  const {
    elements: {H5, H6}
  } = useWebsiteBuilder()

  return (
    <TeaserWrapper {...alignment} className={className}>
      {teaser?.image?.url && <TeaserImage src={teaser.image.url} />}

      <TeaserTitleWrapper>
        <H5 component="h1">
          {preTitle && `${preTitle}: `} {title}
        </H5>
      </TeaserTitleWrapper>

      <H6 component="p">{lead}</H6>
    </TeaserWrapper>
  )
}

export const TeaserGridFlexBlock = ({
  flexTeasers,
  className
}: TeaserGridFlexBlockType & {className?: string}) => {
  console.log(flexTeasers)

  return (
    <TeaserGridFlexBlockWrapper className={className}>
      {flexTeasers?.map((teaser, index) => (
        <Teaser key={index} {...teaser} />
      ))}
    </TeaserGridFlexBlockWrapper>
  )
}
