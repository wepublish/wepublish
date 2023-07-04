import {
  ArticleContainer,
  ArticleWrapper,
  CommentListContainer,
  useWebsiteBuilder
} from '@wepublish/website'
import {useRouter} from 'next/router'

export function ArticleById() {
  const {
    query: {id}
  } = useRouter()
  const {
    elements: {H5}
  } = useWebsiteBuilder()

  return (
    <>
      {id && (
        <>
          <ArticleContainer id={id as string} />

          <ArticleWrapper>
            <H5 component={'h2'}>Kommentare</H5>
            <CommentListContainer id={id as string} />
          </ArticleWrapper>
        </>
      )}
    </>
  )
}

export default ArticleById
