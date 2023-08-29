import {css, styled} from '@mui/material'
import {FlexAlignment, TeaserStyle, Teaser as TeaserType} from '@wepublish/website/api'
import {BuilderTeaserProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {isImageBlock} from '../image/image-block'
import {isTitleBlock} from '../title/title-block'

const TeaserWrapper = styled('article')<FlexAlignment>`
  display: grid;

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

const teaserDate = (teaser: TeaserType) => {
  switch (teaser.__typename) {
    case 'PageTeaser': {
      return teaser.page?.publishedAt
    }

    case 'ArticleTeaser': {
      return teaser.article?.publishedAt
    }

    case 'CustomTeaser':
      return null
  }
}

const teaserAuthors = (teaser: TeaserType) => {
  switch (teaser.__typename) {
    case 'PageTeaser': {
      return null
    }

    case 'ArticleTeaser': {
      return teaser.article?.authors.map(author => author.name)
    }

    case 'CustomTeaser':
      return null
  }
}

const teaserImageStyles = css`
  height: 100%;
  width: 100%;
  object-fit: cover;
`

const teaserLinkStyles = css`
  display: grid;
`

export const TeaserTitle = styled('header')``

export const TeaserDate = styled('time')``

export const TeaserAuthors = styled('div')`
  margin-top: ${({theme}) => theme.spacing(2)};
`

export const Teaser = ({teaser, alignment, className}: BuilderTeaserProps) => {
  const title = teaser && teaserTitle(teaser)
  const preTitle = teaser && teaserPreTitle(teaser)
  const lead = teaser && teaserLead(teaser)
  const href = (teaser && teaserUrl(teaser)) ?? ''
  const image = teaser && teaserImage(teaser)
  const publishDate = teaser && teaserDate(teaser)
  const authors = teaser && teaserAuthors(teaser)

  const {
    date,
    elements: {H5, H6, Link, Image}
  } = useWebsiteBuilder()

  return (
    <TeaserWrapper {...alignment}>
      <Link color="inherit" underline="none" href={href} css={teaserLinkStyles}>
        <TeaserInnerWrapper className={className}>
          {image && <Image image={image} css={teaserImageStyles} />}

          {publishDate && (
            <TeaserDate dateTime={publishDate}>
              {date.format(new Date(publishDate), false)}
            </TeaserDate>
          )}

          <TeaserTitle>
            <H5 component="h1">
              {preTitle && `${preTitle}: `}
              {title}
            </H5>
          </TeaserTitle>

          {teaser?.style !== TeaserStyle.Light && <H6 component="p">{lead}</H6>}

          {!!authors?.length && <TeaserAuthors>{authors?.join(', ')}</TeaserAuthors>}
        </TeaserInnerWrapper>
      </Link>
    </TeaserWrapper>
  )
}
