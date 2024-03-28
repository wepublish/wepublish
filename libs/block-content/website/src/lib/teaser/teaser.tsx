import {Theme, css, styled, useTheme} from '@mui/material'
import {firstParagraphToPlaintext} from '@wepublish/richtext'
import {FlexAlignment, Teaser as TeaserType} from '@wepublish/website/api'
import {BuilderTeaserProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {isImageBlock} from '../image/image-block'
import {isTitleBlock} from '../title/title-block'
import {useMemo, useState} from 'react'

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

export const ImageWrapperStyled = styled('div')`
  grid-column: 1/13;
  width: 100%;
  height: 100%;
  overflow: hidden;
`

const teaserImageStyles = css`
  width: 100%;
  object-fit: cover;
  grid-column: 1/13;
  transition: transform 0.3s ease-in-out;
`

const getEnhancedImageStyles = (theme: Theme, isHovered: boolean) => css`
  ${teaserImageStyles};
  aspect-ratio: 1.8;
  transform: ${isHovered ? 'scale(1.1)' : 'scale(1)'};

  ${theme.breakpoints.up('md')} {
    aspect-ratio: 1/1;
  }
`

const teaserLinkStyles = (theme: Theme) => css`
  display: grid;
  grid-template-rows: min-content;
  align-items: start;
  text-decoration: none;
`

export const TeaserTitles = styled('header')``
export const TeaserTitle = styled('h1')`
  font-size: 26px;

  ${({theme}) => theme.breakpoints.up('md')} {
    font-size: 32px;
  }
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

export const TeaserContent = styled(TeaserInnerWrapper)``

export const ImagePlaceholder = styled('div')`
  width: 100%;
  object-fit: cover;
  grid-column: 1/13;
  aspect-ratio: 1/1;
`

export const TeaserContentStyled = styled(TeaserContent)`
  grid-column: 1/13;
`

export const TeaserPreTitleNoContent = styled(TeaserPreTitle)<{isHovered: boolean}>`
  transition: background-color 0.3s ease-in-out;
  background-color: ${({theme, isHovered}) =>
    isHovered ? theme.palette.primary.main : theme.palette.common.black};
  height: 3px;
  width: 100%;
  margin-bottom: ${({theme}) => theme.spacing(1.5)};
`

export const TeaserPreTitleStyled = styled(TeaserPreTitle)<{isHovered: boolean}>`
  transition: background-color 0.3s ease-in-out;
  background-color: ${({theme, isHovered}) =>
    isHovered ? theme.palette.primary.main : theme.palette.secondary.main};
  height: 3px;
  width: 100%;
  margin-bottom: ${({theme}) => theme.spacing(1.5)};
`

export const PreTitleStyled = styled('span')<{isHovered: boolean}>`
  transition: background-color 0.3s ease-in-out;
  padding: ${({theme}) => `${theme.spacing(0.5)} ${theme.spacing(2)}`};
  background-color: ${({theme, isHovered}) =>
    isHovered ? theme.palette.primary.main : theme.palette.secondary.main};
  display: inline-block;
  font-size: 14px;
  font-weight: 300;
  transform: ${({theme}) => `translateY(-${theme.spacing(3)})`};

  ${({theme}) => theme.breakpoints.up('md')} {
    font-size: 18px;
    transform: ${({theme}) => `translateY(-${theme.spacing(3.5)})`};
  }
`

export const TeaserTitlesStyled = styled(TeaserTitle)`
  margin: 0;
`

export const AuthorsAndDate = styled('p')`
  margin: 0;
  font-size: 12px;
`

export const TeaserLeadStyled = styled('div')`
  font-weight: 300;
  font-size: 15px;
`

export const Teaser = ({teaser, alignment, className}: BuilderTeaserProps) => {
  const [isHovered, setIsHovered] = useState(false)
  const theme = useTheme()
  const title = teaser && selectTeaserTitle(teaser)
  const preTitle = teaser && selectTeaserPreTitle(teaser)
  const lead = teaser && selectTeaserLead(teaser)
  const href = (teaser && selectTeaserUrl(teaser)) ?? ''
  const image = teaser && selectTeaserImage(teaser)
  const publishDate = teaser && selectTeaserDate(teaser)
  const authors = teaser && selectTeaserAuthors(teaser)

  const {
    date,
    elements: {Link, Image}
  } = useWebsiteBuilder()

  const linkStyles = useMemo(() => teaserLinkStyles(theme), [theme])
  const enhancedImageStyles = useMemo(
    () => getEnhancedImageStyles(theme, isHovered),
    [theme, isHovered]
  )

  return (
    <TeaserWrapper
      {...alignment}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}>
      <Link color="inherit" href={href ?? ''} className={className} css={linkStyles}>
        {image ? (
          <ImageWrapperStyled>
            <Image image={image} css={enhancedImageStyles} />
          </ImageWrapperStyled>
        ) : (
          <ImagePlaceholder />
        )}

        <TeaserContentStyled>
          {preTitle ? (
            <TeaserPreTitleStyled isHovered={isHovered}>
              <PreTitleStyled isHovered={isHovered}>{preTitle}</PreTitleStyled>
            </TeaserPreTitleStyled>
          ) : (
            <TeaserPreTitleNoContent isHovered={isHovered} />
          )}

          <TeaserTitlesStyled>{title}</TeaserTitlesStyled>

          <TeaserLeadStyled>{lead}</TeaserLeadStyled>

          <AuthorsAndDate>
            {authors && authors?.length ? <Authors>Von {authors?.join(', ')} </Authors> : null}
            {publishDate && (
              <time dateTime={publishDate} css={{fontWeight: 400}}>
                {'| '}
                {date.format(new Date(publishDate), false)}{' '}
              </time>
            )}
          </AuthorsAndDate>
        </TeaserContentStyled>
      </Link>
    </TeaserWrapper>
  )
}
