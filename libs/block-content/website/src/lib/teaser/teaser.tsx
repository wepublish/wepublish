import {Theme, css, styled, useTheme} from '@mui/material'
import {firstParagraphToPlaintext} from '@wepublish/richtext'
import {FlexAlignment, Teaser as TeaserType} from '@wepublish/website/api'
import {BuilderTeaserProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {isImageBlock} from '../image/image-block'
import {isTitleBlock} from '../title/title-block'
import {useMemo} from 'react'
import {useHover} from 'react-aria'

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
      return teaser.article?.peeredArticleURL

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

    case 'ArticleTeaser':
    case 'PeerArticleTeaser': {
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

    case 'PeerArticleTeaser':
    case 'ArticleTeaser': {
      return teaser.article?.authors.map(author => author.name)
    }

    case 'EventTeaser':
    case 'CustomTeaser':
      return null
  }
}

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

export const TeaserImageWrapper = styled('div')`
  grid-column: 1/13;
  width: 100%;
  height: 100%;
  overflow: hidden;
  grid-area: image;
`

const useImageStyles = (isHovered: boolean) => {
  const theme = useTheme()

  return useMemo(
    () => css`
      width: 100%;
      object-fit: cover;
      grid-column: 1/13;
      transition: transform 0.3s ease-in-out;
      aspect-ratio: 1.8;
      transform: ${isHovered ? 'scale(1.1)' : 'scale(1)'};

      ${theme.breakpoints.up('md')} {
        aspect-ratio: 1/1;
      }
    `,
    [theme, isHovered]
  )
}

const teaserLinkStyles = () => css`
  display: grid;
  grid-template-rows: min-content;
  align-items: start;
  text-decoration: none;
  grid-template-areas:
    'image'
    'pretitle'
    'title'
    'lead'
    'authors';
`

const teaserHeaderStyles = (theme: Theme) => css`
  grid-area: title;
  margin-bottom: ${theme.spacing(1)};
`

const teaserLeadStyles = css`
  font-weight: 300;
  font-size: 15px;
  grid-area: lead;
`

export const TeaserPreTitle = styled('span')``
export const TeaserLead = styled('p')``
export const Authors = styled('span')`
  font-weight: 500;
`

export const TeaserDate = styled('time')``

export const TeaserAuthors = styled('div')`
  margin-top: ${({theme}) => theme.spacing(2)};
`

export const TeaserContent = styled(TeaserInnerWrapper)`
  grid-column: 1/13;
`

export const ImagePlaceholder = styled('div')`
  width: 100%;
  object-fit: cover;
  grid-column: 1/13;
  aspect-ratio: 1/1;
`

export const TeaserPreTitleNoContent = styled(TeaserPreTitle)<{isHovered: boolean}>`
  transition: background-color 0.3s ease-in-out;
  background-color: ${({theme, isHovered}) =>
    isHovered ? theme.palette.primary.main : theme.palette.common.black};
  height: 3px;
  width: 100%;
  margin-bottom: ${({theme}) => theme.spacing(1.5)};
`

export const TeaserPreTitleWrapper = styled(TeaserPreTitle)<{isHovered: boolean}>`
  transition: background-color 0.3s ease-in-out;
  background-color: ${({theme, isHovered}) =>
    isHovered ? theme.palette.primary.main : theme.palette.secondary.main};
  height: 3px;
  width: 100%;
  margin-bottom: ${({theme}) => theme.spacing(1.5)};
  grid-area: pretitle;
`

export const PreTitle = styled('div')<{isHovered: boolean}>`
  transition: background-color 0.3s ease-in-out;
  padding: ${({theme}) => `${theme.spacing(0.5)} ${theme.spacing(2)}`};
  background-color: ${({theme, isHovered}) =>
    isHovered ? theme.palette.primary.main : theme.palette.secondary.main};
  width: fit-content;
  font-size: 14px;
  font-weight: 300;
  transform: ${({theme}) => `translateY(-${theme.spacing(3.5)})`};

  ${({theme}) => theme.breakpoints.up('md')} {
    font-size: 18px;
    transform: ${({theme}) => `translateY(-${theme.spacing(4)})`};
  }
`

export const AuthorsAndDate = styled('div')`
  margin: 0;
  font-size: 12px;
  grid-area: authors;
`

export const Time = styled('time')`
  font-weight: 400;
`

export const Teaser = ({teaser, alignment, className}: BuilderTeaserProps) => {
  const theme = useTheme()
  const {hoverProps, isHovered} = useHover({})
  const title = teaser && selectTeaserTitle(teaser)
  const preTitle = teaser && selectTeaserPreTitle(teaser)
  const lead = teaser && selectTeaserLead(teaser)
  const href = (teaser && selectTeaserUrl(teaser)) ?? ''
  const image = teaser && selectTeaserImage(teaser)
  const publishDate = teaser && selectTeaserDate(teaser)
  const authors = teaser && selectTeaserAuthors(teaser)

  const {
    date,
    elements: {Link, Image, Paragraph, H4}
  } = useWebsiteBuilder()

  const linkStyles = teaserLinkStyles()
  const headerStyles = teaserHeaderStyles(theme)
  const imageStyles = useImageStyles(isHovered)

  return (
    <TeaserWrapper {...alignment} {...(hoverProps as object)}>
      <Link color="inherit" href={href ?? ''} className={className} css={linkStyles}>
        {image ? (
          <TeaserImageWrapper>
            <Image image={image} css={imageStyles} />
          </TeaserImageWrapper>
        ) : (
          <ImagePlaceholder />
        )}

        {preTitle ? (
          <TeaserPreTitleWrapper isHovered={isHovered}>
            <PreTitle isHovered={isHovered}>{preTitle}</PreTitle>
          </TeaserPreTitleWrapper>
        ) : (
          <TeaserPreTitleNoContent isHovered={isHovered} />
        )}

        <H4 css={headerStyles}>{title}</H4>

        <Paragraph css={teaserLeadStyles}>{lead}</Paragraph>

        <AuthorsAndDate>
          {authors && authors?.length ? <Authors>Von {authors?.join(', ')} </Authors> : null}
          {publishDate && (
            <Time dateTime={publishDate}>
              {'| '}
              {date.format(new Date(publishDate), false)}{' '}
            </Time>
          )}
        </AuthorsAndDate>
      </Link>
    </TeaserWrapper>
  )
}
