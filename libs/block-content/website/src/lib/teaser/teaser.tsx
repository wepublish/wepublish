import {Chip, css, useTheme} from '@mui/material'
import {firstParagraphToPlaintext} from '@wepublish/richtext'
import {FlexAlignment, Teaser as TeaserType} from '@wepublish/website/api'
import {BuilderTeaserProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {isImageBlock} from '../image/image-block'
import {isTitleBlock} from '../title/title-block'
import {PropsWithChildren, useMemo} from 'react'
import styled from '@emotion/styled'

export const selectTeaserTitle = (teaser: TeaserType) => {
  switch (teaser.__typename) {
    case 'PageTeaser': {
      const titleBlock = teaser.page?.latest.blocks?.find(isTitleBlock)
      return teaser.title || teaser.page?.latest.title || titleBlock?.title
    }

    case 'ArticleTeaser': {
      const titleBlock = teaser.article?.latest.blocks?.find(isTitleBlock)
      return teaser.title || teaser.article?.latest.title || titleBlock?.title
    }

    case 'EventTeaser':
      return teaser.title ?? teaser.event?.name

    case 'CustomTeaser':
      return teaser.title
  }
}

export const selectTeaserPreTitle = (teaser: TeaserType) => {
  switch (teaser.__typename) {
    case 'ArticleTeaser':
      return (
        teaser.preTitle ||
        teaser.article?.latest.preTitle ||
        teaser.article?.tags?.find(({main}) => !!main)?.tag
      )
    case 'PageTeaser':
      return teaser.preTitle || teaser.page?.tags?.find(({main}) => !!main)?.tag
    case 'EventTeaser':
    case 'CustomTeaser':
      return teaser.preTitle
  }
}

export const selectTeaserLead = (teaser: TeaserType) => {
  switch (teaser.__typename) {
    case 'PageTeaser': {
      const titleBlock = teaser.page?.latest.blocks?.find(isTitleBlock)
      return teaser.lead || teaser.page?.latest.description || titleBlock?.lead
    }

    case 'ArticleTeaser': {
      const titleBlock = teaser.article?.latest.blocks?.find(isTitleBlock)
      return teaser.lead || teaser.article?.latest.lead || titleBlock?.lead
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

    case 'EventTeaser':
      return teaser.event?.url

    case 'CustomTeaser':
      return teaser.contentUrl
  }
}

export const selectTeaserTarget = (teaser: TeaserType): string | undefined => {
  if (teaser.__typename === 'CustomTeaser') {
    return teaser.openInNewTab ? '_blank' : undefined
  }
  return undefined
}

export const selectTeaserImage = (teaser: TeaserType) => {
  switch (teaser.__typename) {
    case 'PageTeaser': {
      const imageBlock = teaser.page?.latest.blocks?.find(isImageBlock)
      return teaser.image ?? teaser?.page?.latest.image ?? imageBlock?.image
    }

    case 'ArticleTeaser': {
      const imageBlock = teaser.article?.latest.blocks?.find(isImageBlock)
      return teaser.image ?? teaser?.article?.latest.image ?? imageBlock?.image
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
      return teaser.article?.latest.authors
        .filter(author => !author.hideOnTeaser)
        .map(author => author.name)
    }

    case 'EventTeaser':
    case 'CustomTeaser':
      return null
  }
}

export const selectTeaserTags = (teaser: TeaserType) => {
  switch (teaser.__typename) {
    case 'PageTeaser': {
      return teaser.page?.tags?.filter(({tag, main}) => !!tag && main) ?? []
    }

    case 'ArticleTeaser': {
      return teaser.article?.tags?.filter(({tag, main}) => !!tag && main) ?? []
    }

    case 'EventTeaser':
      return teaser.event?.tags?.filter(({tag, main}) => !!tag && main) ?? []

    case 'CustomTeaser':
      return (
        teaser.properties
          ?.find(property => property.key === 'tags')
          ?.value.split(/,\s+/)
          .map(tag => ({tag, id: tag, url: '/'})) ?? []
      )
  }

  return []
}

export const TeaserWrapper = styled('article')<FlexAlignment>`
  display: grid;

  ${({theme, w}) =>
    w > 6 &&
    css`
      grid-column: 1 / -1;

      ${theme.breakpoints.up('md')} {
        ${TeaserTitle} {
          font-size: ${theme.typography.h3.fontSize};
          line-height: ${theme.typography.h3.lineHeight};
        }

        ${TeaserLead} {
          font-size: ${theme.typography.h6.fontSize};
          line-height: ${theme.typography.h6.lineHeight};
        }
      }
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

export const useImageStyles = () => {
  const theme = useTheme()

  return useMemo(
    () => css`
      max-height: 400px;
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
`

export const TeaserLead = styled('p')`
  font-weight: 300;
  grid-area: lead;
`

export const TeaserAuthors = styled('span')`
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

export const TeaserPreTitle = styled('div')`
  transition-property: color, background-color;
  transition-duration: 0.3s;
  transition-timing-function: ease-in-out;
  padding: ${({theme}) => `${theme.spacing(0.5)} ${theme.spacing(2)}`};
  background-color: ${({theme}) => theme.palette.accent.main};
  color: ${({theme}) => theme.palette.accent.contrastText};
  width: fit-content;
  font-size: 14px;
  font-weight: 300;
  transform: translateY(-100%);

  :where(${TeaserWrapper}:hover &) {
    background-color: ${({theme}) => theme.palette.primary.main};
    color: ${({theme}) => theme.palette.primary.contrastText};
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

export const TeaserTags = styled('div')`
  display: none;
  flex-flow: row wrap;
  gap: ${({theme}) => theme.spacing(1)};
  grid-area: tags;
`

const TeaserContent = ({
  href,
  className,
  children,
  target
}: PropsWithChildren<{href?: string; className?: string; target?: string}>) => {
  const {
    elements: {Link}
  } = useWebsiteBuilder()

  if (href) {
    return (
      <Link color="inherit" underline="none" href={href} target={target}>
        <TeaserContentWrapper className={className}>{children}</TeaserContentWrapper>
      </Link>
    )
  }

  return <TeaserContentWrapper className={className}>{children}</TeaserContentWrapper>
}

export const extractTeaserData = (teaser: BuilderTeaserProps['teaser']) => {
  const preTitle = teaser && selectTeaserPreTitle(teaser)
  return {
    title: teaser && selectTeaserTitle(teaser),
    preTitle,
    lead: teaser && selectTeaserLead(teaser),
    href: (teaser && selectTeaserUrl(teaser)) ?? '',
    target: teaser ? selectTeaserTarget(teaser) : undefined,
    image: teaser && selectTeaserImage(teaser),
    publishDate: teaser && selectTeaserDate(teaser),
    authors: teaser && selectTeaserAuthors(teaser),
    tags: teaser && selectTeaserTags(teaser).filter(tag => tag.tag !== preTitle)
  }
}

export const Teaser = ({teaser, alignment, className}: BuilderTeaserProps) => {
  const {title, preTitle, lead, href, target, image, publishDate, authors, tags} =
    extractTeaserData(teaser)
  const {
    date,
    elements: {Image, Paragraph, H4}
  } = useWebsiteBuilder()

  const imageStyles = useImageStyles()
  return (
    <TeaserWrapper {...alignment}>
      <TeaserContent href={href} className={className} target={target}>
        <TeaserImageWrapper>
          {image && <Image image={image} css={imageStyles} />}
        </TeaserImageWrapper>

        {preTitle && (
          <TeaserPreTitleWrapper>
            <TeaserPreTitle>{preTitle}</TeaserPreTitle>
          </TeaserPreTitleWrapper>
        )}
        {!preTitle && <TeaserPreTitleNoContent />}

        <H4 component={TeaserTitle} gutterBottom>
          {title}
        </H4>
        {lead && <Paragraph component={TeaserLead}>{lead}</Paragraph>}

        <TeaserMetadata>
          {authors && authors?.length ? (
            <TeaserAuthors>Von {authors?.join(', ')} </TeaserAuthors>
          ) : null}

          {publishDate && (
            <TeaserTime suppressHydrationWarning dateTime={publishDate}>
              {authors && authors?.length ? '| ' : null}
              {date.format(new Date(publishDate), false)}{' '}
            </TeaserTime>
          )}
        </TeaserMetadata>

        {!!tags?.length && (
          <TeaserTags>
            {tags?.slice(0, 5).map(tag => (
              <Chip key={tag.id} label={tag.tag} color="primary" variant="outlined" />
            ))}
          </TeaserTags>
        )}
      </TeaserContent>
    </TeaserWrapper>
  )
}
