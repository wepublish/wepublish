import {
  ArticleWrapper,
  CommentListContainer,
  PeerArticleContainer,
  useWebsiteBuilder
} from '@wepublish/website'
import {useRouter} from 'next/router'

export function ArticleById() {
  const {
    query: {peerId, articleId}
  } = useRouter()

  const {
    elements: {H5}
  } = useWebsiteBuilder()

  return (
    <>
      {peerId && articleId && (
        <>
          <PeerArticleContainer peerId={peerId as string} articleId={articleId as string} />

          <ArticleWrapper>
            <H5 component={'h2'}>Kommentare</H5>
            <CommentListContainer id={articleId as string} />
          </ArticleWrapper>
        </>
      )}
    </>
  )
}

export default ArticleById
