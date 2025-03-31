import styled from '@emotion/styled'
import {BuilderArticleProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {Article as ArticleType, BlockContent} from '@wepublish/website/api'
import {CommentListWrapper} from '@wepublish/comments/website'
import {ContentWrapper} from '@wepublish/content/website'
import {ArticleListWrapper, ArticleTrackingPixels} from '@wepublish/article/website'
import {ArticleProvider} from '../context/article-context'

export const ArticleWrapper = styled(ContentWrapper)`
  ${({theme}) => theme.breakpoints.up('md')} {
    & > :is(${ArticleListWrapper}, ${CommentListWrapper}) {
      grid-column: 2/12;
    }
  }
`

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

        <Blocks blocks={(article?.latest.blocks as BlockContent[]) ?? []} type="Article" />

        <ArticleTopMeta>{article && <ArticleAuthors article={article} />}</ArticleTopMeta>

        <ArticlePreTitle>{article.latest.preTitle}</ArticlePreTitle>

        <ArticleBottomMeta>
          {article && <ArticleMeta article={article} />}
          <H3>Ihre Meinung zu diesem Artikel</H3>
          <Button onClick={scrollToComments}>Kommentare</Button>
        </ArticleBottomMeta>

        {children}

        <ArticleTrackingPixels trackingPixels={article?.trackingPixels} />
      </ArticleWrapper>
    </ArticleProvider>
  )
}
