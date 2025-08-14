import styled from '@emotion/styled'
import {BuilderArticleProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {Article as ArticleType, BlockContent} from '@wepublish/website/api'
import {CommentListWrapper} from '@wepublish/comments/website'
import {ContentWrapper} from '@wepublish/content/website'
import {ArticleListWrapper, ArticleTrackingPixels} from '@wepublish/article/website'
import {ArticleProvider} from '../context/article-context'
import {OnlineReportsQuoteBlockWrapper} from './quote-block'

import {
  BreakBlockWrapper,
  EventBlockWrapper,
  HeadingWithImage,
  HeadingWithoutImage,
  ImageBlockCaption,
  ImageBlockInnerWrapper,
  ImageBlockWrapper,
  RichTextBlockWrapper,
  SliderWrapper,
  TitleBlockWrapper
} from '@wepublish/block-content/website'

export const ArticlePreTitle = styled('div')`
  margin-top: ${({theme}) => theme.spacing(4)};
  margin-bottom: -${({theme}) => theme.spacing(5)};

  ${({theme}) => theme.breakpoints.up('md')} {
    margin-bottom: -${({theme}) => theme.spacing(3.5)};
  }

  color: ${({theme}) => theme.palette.primary.main};
  grid-row-start: 1;
  font-weight: 500;
`

export const ArticleTopMeta = styled('aside')`
  grid-row-start: 3;
`
export const ArticleBottomMeta = styled('aside')`
  display: flex;
  flex-direction: column;
  gap: ${({theme}) => theme.spacing(5)};
  align-items: start;
`

export const ArticleWrapper = styled(ContentWrapper)`
  ${({theme}) => theme.breakpoints.up('md')} {
    & > :is(${ArticleListWrapper}, ${CommentListWrapper}) {
      grid-column: 2/12;
    }
  }

  ${({theme}) => theme.breakpoints.down('md')} {
    row-gap: ${({theme}) => theme.spacing(5)};
  }

  ${({theme}) => theme.breakpoints.up('md')} {
    row-gap: ${({theme}) => theme.spacing(4)};

    &
      > :is(
        ${RichTextBlockWrapper},
          ${ArticleTopMeta},
          ${ArticleBottomMeta},
          ${ArticlePreTitle},
          ${TitleBlockWrapper},
          ${OnlineReportsQuoteBlockWrapper}
      ) {
      grid-column: 3/11;
    }

    ${RichTextBlockWrapper} {
    }

    & > :is(${ImageBlockWrapper}, ${SliderWrapper}, ${EventBlockWrapper}, ${BreakBlockWrapper}) {
      grid-column: 2/12;
    }
  }

  ${HeadingWithoutImage}, ${HeadingWithImage} {
    text-transform: none;
    font-family: ${({theme}) => theme.typography.subtitle2.fontFamily};
    font-style: ${({theme}) => theme.typography.subtitle2.fontStyle};
    font-weight: ${({theme}) => theme.typography.subtitle2.fontWeight};
  }

  ${ImageBlockInnerWrapper} {
    gap: ${({theme}) => theme.spacing(1)};
  }

  ${ImageBlockCaption} {
    color: #7c7c7c;
    font-size: 14px;
  }
`

export function OnlineReportsArticle({
  className,
  data,
  children,
  loading,
  error
}: BuilderArticleProps) {
  const {
    ArticleSEO,
    ArticleAuthors,
    ArticleMeta,
    blocks: {Blocks},
    elements: {H3, Button}
  } = useWebsiteBuilder()

  const article = data?.article as ArticleType

  const scrollToComments = () => {
    const el = document.getElementById('comments')
    if (el) {
      el.scrollIntoView({behavior: 'smooth'})
    }
  }

  return (
    <ArticleProvider article={article}>
      <ArticleWrapper className={className}>
        {article && <ArticleSEO article={article} />}

        <Blocks
          key={article.id}
          blocks={(article?.latest.blocks as BlockContent[]) ?? []}
          type="Article"
        />

        <ArticleTopMeta>{article && <ArticleAuthors article={article} />}</ArticleTopMeta>

        <ArticlePreTitle>{article.latest.preTitle}</ArticlePreTitle>

        <ArticleBottomMeta>
          {article && <ArticleMeta article={article} />}
          {!data?.article?.disableComments && (
            <>
              <H3>Ihre Meinung zu diesem Artikel</H3>
              <Button onClick={scrollToComments}>Kommentare</Button>
            </>
          )}
        </ArticleBottomMeta>

        {children}

        <ArticleTrackingPixels trackingPixels={article?.trackingPixels} />
      </ArticleWrapper>
    </ArticleProvider>
  )
}
