import {css, styled} from '@mui/material'
import {firstParagraphToPlaintext} from '@wepublish/richtext'
import {FlexAlignment, TeaserStyle, Teaser as TeaserType} from '@wepublish/website/api'
import {BuilderTeaserProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {isImageBlock} from '../image/image-block'
import {isTitleBlock} from '../title/title-block'

export const TeaserWrapper = styled('article')<FlexAlignment>`
  display: grid;

  ${({w}) =>
    w > 6 &&
    css`
      grid-column: 1 / -1;
    `}

  ${({theme, h, w, x, y}) => css`
    ${theme.breakpoints.up('md')} {
      grid-column-start: ${x + 1};
      grid-column-end: ${x + 1 + w};
      grid-row-start: ${y + 1};
      grid-row-end: ${y + 1 + h};
    }
  `}
`

export const TeaserInnerWrapper = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(1)};
  grid-template-rows: auto;
  grid-auto-rows: max-content;
`

export const selectTeaserTitle = (teaser: TeaserType) => {
  switch (teaser.__typename) {
    case 'PageTeaser': {
      const titleBlock = teaser.page?.blocks.find(isTitleBlock)
      return teaser.title || titleBlock?.title || teaser.page?.title
    }

    case 'PeerArticleTeaser':
    case 'ArticleTeaser': {
      const titleBlock = teaser.article?.blocks.find(isTitleBlock)
      return teaser.title || titleBlock?.title || teaser.article?.title
    }

    case 'EventTeaser':
      return teaser.title ?? teaser.event?.name

    case 'CustomTeaser':
      return teaser.title
  }
}

export const selectTeaserPreTitle = (teaser: TeaserType) => {
  switch (teaser.__typename) {
    case 'PeerArticleTeaser':
    case 'ArticleTeaser':
      return teaser.preTitle || teaser.article?.preTitle
    case 'EventTeaser':
    case 'PageTeaser':
    case 'CustomTeaser':
      return teaser.preTitle
  }
}

export const selectTeaserLead = (teaser: TeaserType) => {
  switch (teaser.__typename) {
    case 'PageTeaser': {
      const titleBlock = teaser.page?.blocks.find(isTitleBlock)
      return teaser.lead || titleBlock?.lead || teaser.page?.description
    }

    case 'PeerArticleTeaser':
    case 'ArticleTeaser': {
      const titleBlock = teaser.article?.blocks.find(isTitleBlock)
      return teaser.lead || titleBlock?.lead || teaser.article?.lead
    }

    case 'EventTeaser':
      return teaser.lead ?? firstParagraphToPlaintext(teaser.event?.description)?.substring(0, 225)

    case 'CustomTeaser':
      return teaser.lead
  }
}

export const selectTeaserUrl = (teaser: TeaserType) => {
  switch (teaser.__typename) {
    case 'PageTeaser': {
      return teaser.page?.url
    }

    case 'ArticleTeaser':
      return teaser.article?.url

    case 'PeerArticleTeaser':
      return teaser.peeredArticleURL

    case 'EventTeaser':
      return teaser.event?.url

    case 'CustomTeaser':
      return teaser.contentUrl
  }
}

export const selectTeaserImage = (teaser: TeaserType) => {
  switch (teaser.__typename) {
    case 'PageTeaser': {
      const imageBlock = teaser.page?.blocks.find(isImageBlock)
      return teaser.image ?? imageBlock?.image ?? teaser?.page?.image
    }

    case 'PeerArticleTeaser':
    case 'ArticleTeaser': {
      const imageBlock = teaser.article?.blocks.find(isImageBlock)
      return teaser.image ?? imageBlock?.image ?? teaser?.article?.image
    }

    case 'EventTeaser':
      return teaser.image ?? teaser.event?.image

    case 'CustomTeaser':
      return teaser.image
  }
}

export const selectTeaserDate = (teaser: TeaserType) => {
  switch (teaser.__typename) {
    case 'PageTeaser': {
      return teaser.page?.publishedAt
    }

    case 'ArticleTeaser': {
      return teaser.article?.publishedAt
    }

    case 'EventTeaser': {
      return teaser.event?.startsAt
    }

    case 'CustomTeaser':
      return null
  }
}

export const selectTeaserAuthors = (teaser: TeaserType) => {
  switch (teaser.__typename) {
    case 'PageTeaser': {
      return null
    }

    case 'ArticleTeaser': {
      return teaser.article?.authors.map(author => author.name)
    }

    case 'EventTeaser':
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

export const TeaserTitles = styled('header')``
export const TeaserTitle = styled('h1')``
export const TeaserPreTitle = styled('div')``
export const TeaserLead = styled('p')``

export const TeaserDate = styled('time')``

export const TeaserAuthors = styled('div')`
  margin-top: ${({theme}) => theme.spacing(2)};
`

export const TeaserContent = styled(TeaserInnerWrapper)``

export const Teaser = ({teaser, alignment, className}: BuilderTeaserProps) => {
  const title = teaser && selectTeaserTitle(teaser)
  const preTitle = teaser && selectTeaserPreTitle(teaser)
  const lead = teaser && selectTeaserLead(teaser)
  const href = (teaser && selectTeaserUrl(teaser)) ?? ''
  const image = teaser && selectTeaserImage(teaser)
  const publishDate = teaser && selectTeaserDate(teaser)
  const authors = teaser && selectTeaserAuthors(teaser)

  const {
    date,
    elements: {H5, H6, Link, Image}
  } = useWebsiteBuilder()

  return (
    <TeaserWrapper {...alignment}>
      <Link color="inherit" underline="none" href={href} css={teaserLinkStyles}>
        <TeaserInnerWrapper className={className}>
          {image && <Image image={image} css={teaserImageStyles} />}

          <TeaserContent>
            {publishDate && (
              <TeaserDate dateTime={publishDate}>
                {date.format(new Date(publishDate), false)}
              </TeaserDate>
            )}

            <TeaserTitles>
              {preTitle && <H6 component={TeaserPreTitle}>{preTitle}</H6>}
              <H5 component={TeaserTitle}>{title}</H5>
            </TeaserTitles>

            {teaser?.style !== TeaserStyle.Light && <H6 component={TeaserLead}>{lead}</H6>}

            {!!authors?.length && <TeaserAuthors>{authors?.join(', ')}</TeaserAuthors>}
          </TeaserContent>
        </TeaserInnerWrapper>
      </Link>
    </TeaserWrapper>
  )
}
