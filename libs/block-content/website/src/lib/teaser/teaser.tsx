import {css, styled, useTheme} from '@mui/material'
import {firstParagraphToPlaintext} from '@wepublish/richtext'
import {FlexAlignment, Teaser as TeaserType} from '@wepublish/website/api'
import {BuilderTeaserProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {isImageBlock} from '../image/image-block'
import {isTitleBlock} from '../title/title-block'
import {PropsWithChildren, useMemo} from 'react'

export const selectTeaserTitle = (teaser: TeaserType) => {
  switch (teaser.__typename) {
    case 'PageTeaser': {
      const titleBlock = teaser.page?.blocks?.find(isTitleBlock)
      return teaser.title || teaser.page?.title || titleBlock?.title
    }

    case 'PeerArticleTeaser':
    case 'ArticleTeaser': {
      const titleBlock = teaser.article?.blocks?.find(isTitleBlock)
      return teaser.title || teaser.article?.title || titleBlock?.title
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
      const titleBlock = teaser.page?.blocks?.find(isTitleBlock)
      return teaser.lead || teaser.page?.description || titleBlock?.lead
    }

    case 'PeerArticleTeaser':
    case 'ArticleTeaser': {
      const titleBlock = teaser.article?.blocks?.find(isTitleBlock)
      return teaser.lead || teaser.article?.lead || titleBlock?.lead
    }

    case 'EventTeaser':
      return (
        teaser.lead ||
        teaser.event?.lead ||
        firstParagraphToPlaintext(teaser.event?.description)?.substring(0, 225)
      )

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
      const imageBlock = teaser.page?.blocks?.find(isImageBlock)
      return teaser.image ?? teaser?.page?.image ?? imageBlock?.image
    }

    case 'PeerArticleTeaser':
    case 'ArticleTeaser': {
      const imageBlock = teaser.article?.blocks?.find(isImageBlock)
      return teaser.image ?? teaser?.article?.image ?? imageBlock?.image
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

  &:empty {
    min-height: ${({theme}) => theme.spacing(4)};
  }
`

const useImageStyles = () => {
  const theme = useTheme()

  return useMemo(
    () => css`
      width: 100%;
      object-fit: cover;
      grid-column: 1/13;
      transition: transform 0.3s ease-in-out;
      aspect-ratio: 1.8;

      :where(${TeaserWrapper}:hover &) {
        transform: scale(1.1);
      }

      ${theme.breakpoints.up('md')} {
        aspect-ratio: 1;
      }
    `,
    [theme]
  )
}

export const TeaserContentWrapper = styled('div')`
  display: grid;
  grid-auto-rows: max-content;
  align-items: start;
  grid-template-areas:
    'image'
    'pretitle'
    'title'
    'lead'
    'authors';
`

export const TeaserTitle = styled('h1')`
  grid-area: title;
  margin-bottom: ${({theme}) => theme.spacing(1)};
`

export const TeaserLead = styled('p')`
  font-weight: 300;
  font-size: ${({theme}) => theme.typography.body1.fontSize};
  grid-area: lead;
`

export const Authors = styled('span')`
  font-weight: 500;
`

export const TeaserPreTitleNoContent = styled('div')`
  transition: background-color 0.3s ease-in-out;
  background-color: ${({theme}) => theme.palette.common.black};
  height: 3px;
  width: 100%;
  margin-bottom: ${({theme}) => theme.spacing(1.5)};

  :where(${TeaserWrapper}:hover &) {
    background-color: ${({theme}) => theme.palette.primary.main};
  }
`

export const TeaserPreTitleWrapper = styled('div')`
  transition: background-color 0.3s ease-in-out;
  background-color: ${({theme}) => theme.palette.accent.main};
  height: 3px;
  width: 100%;
  margin-bottom: ${({theme}) => theme.spacing(1.5)};
  grid-area: pretitle;

  :where(${TeaserWrapper}:hover &) {
    background-color: ${({theme}) => theme.palette.primary.main};
  }
`

export const PreTitle = styled('div')`
  transition: background-color 0.3s ease-in-out;
  padding: ${({theme}) => `${theme.spacing(0.5)} ${theme.spacing(2)}`};
  background-color: ${({theme}) => theme.palette.accent.main};
  width: fit-content;
  font-size: 14px;
  font-weight: 300;
  transform: translateY(-100%);

  :where(${TeaserWrapper}:hover &) {
    background-color: ${({theme}) => theme.palette.primary.main};
  }

  ${({theme}) => theme.breakpoints.up('md')} {
    font-size: 18px;
  }
`

export const TeaserMetadata = styled('div')`
  margin: 0;
  font-size: 12px;
  grid-area: authors;
`

export const TeaserTime = styled('time')`
  font-weight: 400;
`

const TeaserContent = ({
  href,
  className,
  children
}: PropsWithChildren<{href?: string; className?: string}>) => {
  const {
    elements: {Link}
  } = useWebsiteBuilder()

  if (href) {
    return (
      <Link color="inherit" underline="none" href={href}>
        <TeaserContentWrapper className={className}>{children}</TeaserContentWrapper>
      </Link>
    )
  }

  return <TeaserContentWrapper className={className}>{children}</TeaserContentWrapper>
}

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
    elements: {Image, Paragraph, H4}
  } = useWebsiteBuilder()

  const imageStyles = useImageStyles()

  return (
    <TeaserWrapper {...alignment}>
      <TeaserContent href={href} className={className}>
        <TeaserImageWrapper>
          {image && <Image image={image} css={imageStyles} />}
        </TeaserImageWrapper>

        {preTitle && (
          <TeaserPreTitleWrapper>
            <PreTitle>{preTitle}</PreTitle>
          </TeaserPreTitleWrapper>
        )}
        {!preTitle && <TeaserPreTitleNoContent />}

        <H4 component={TeaserTitle}>{title}</H4>
        {lead && <Paragraph component={TeaserLead}>{lead}</Paragraph>}

        <TeaserMetadata>
          {authors && authors?.length ? <Authors>Von {authors?.join(', ')} </Authors> : null}

          {publishDate && (
            <TeaserTime suppressHydrationWarning dateTime={publishDate}>
              {authors && authors?.length ? '| ' : null}
              {date.format(new Date(publishDate), false)}{' '}
            </TeaserTime>
          )}
        </TeaserMetadata>
      </TeaserContent>
    </TeaserWrapper>
  )
}
