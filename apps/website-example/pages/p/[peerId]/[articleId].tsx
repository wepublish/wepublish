import {PeerArticleContainer} from '@wepublish/website'
import {useRouter} from 'next/router'

export function ArticleById() {
  const {
    query: {peerId, articleId}
  } = useRouter()

  return (
    <>
      {peerId && articleId && (
        <PeerArticleContainer peerId={peerId as string} articleId={articleId as string} />
      )}
    </>
  )
}

export default ArticleById
