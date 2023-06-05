import {css, styled} from '@mui/material'
import {FlexAlignment, Teaser as TeaserType} from '@wepublish/website/api'
import {BuilderTeaserProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {isImageBlock} from './image-block'
import {isTitleBlock} from './title-block'

const TeaserWrapper = styled('article')<FlexAlignment>`
  ${({theme, h, w, x, y}) => css`
    ${theme.breakpoints.up('md')} {
      grid-column-start: ${x + 1};
      grid-column-end: ${x + 1 + w};
      grid-row-start: ${y + 1};
      grid-row-end: ${y + 1 + h};
    }
  `}
`

const TeaserInnerWrapper = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(1)};
  grid-template-rows: auto;
  grid-auto-rows: max-content;
`

const teaserTitle = (teaser: TeaserType) => {
  switch (teaser.__typename) {
    case 'PageTeaser': {
      const titleBlock = teaser.page?.blocks.find(isTitleBlock)
      return teaser.title || titleBlock?.title || teaser.page?.title
    }

    case 'ArticleTeaser': {
      const titleBlock = teaser.article?.blocks.find(isTitleBlock)
      return teaser.title || titleBlock?.title || teaser.article?.title
    }

    case 'CustomTeaser':
      return teaser.title
  }
}

const teaserPreTitle = (teaser: TeaserType) => {
  switch (teaser.__typename) {
    case 'PageTeaser':
      return teaser.preTitle
    case 'ArticleTeaser':
      return teaser.preTitle || teaser.article?.preTitle
    case 'CustomTeaser':
      return teaser.preTitle
  }
}

const teaserLead = (teaser: TeaserType) => {
  switch (teaser.__typename) {
    case 'PageTeaser': {
      const titleBlock = teaser.page?.blocks.find(isTitleBlock)
      return teaser.lead || titleBlock?.lead || teaser.page?.description
    }

    case 'ArticleTeaser': {
      const titleBlock = teaser.article?.blocks.find(isTitleBlock)
      return teaser.lead || titleBlock?.lead || teaser.article?.lead
    }

    case 'CustomTeaser':
      return teaser.lead
  }
}

const teaserUrl = (teaser: TeaserType) => {
  switch (teaser.__typename) {
    case 'PageTeaser': {
      return teaser.page?.url
    }

    case 'ArticleTeaser': {
      return teaser.article?.url
    }

    case 'CustomTeaser':
      return teaser.contentUrl
  }
}

const teaserImage = (teaser: TeaserType) => {
  switch (teaser.__typename) {
    case 'PageTeaser': {
      const imageBlock = teaser.page?.blocks.find(isImageBlock)
      return teaser.image ?? imageBlock?.image
    }

    case 'ArticleTeaser': {
      const imageBlock = teaser.article?.blocks.find(isImageBlock)
      return teaser.image ?? imageBlock?.image
    }

    case 'CustomTeaser':
      return teaser.image
  }
}

const teaserImageStyles = css`
  object-fit: cover;
  height: 100%;
`

const TeaserTitleWrapper = styled('header')``

export const Teaser = ({teaser, alignment, className, showLead}: BuilderTeaserProps) => {
  const title = teaser && teaserTitle(teaser)
  const preTitle = teaser && teaserPreTitle(teaser)
  const lead = teaser && teaserLead(teaser)
  const href = (teaser && teaserUrl(teaser)) ?? ''
  const image = teaser && teaserImage(teaser)

  const {
    elements: {H5, H6, Link, Image}
  } = useWebsiteBuilder()

  return (
    <TeaserWrapper {...alignment}>
      <Link color="inherit" underline="none" href={href}>
        <TeaserInnerWrapper className={className}>
          {image && <Image image={image} css={teaserImageStyles} />}

          <TeaserTitleWrapper>
            <H5 component="h1">
              {preTitle && `${preTitle}: `} {title}
            </H5>
          </TeaserTitleWrapper>

          {showLead && <H6 component="p">{lead}</H6>}
        </TeaserInnerWrapper>
      </Link>
    </TeaserWrapper>
  )
}
