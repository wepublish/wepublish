import {ArticleContainer} from '@wepublish/website'
import {useRouter} from 'next/router'

export function ArticleById() {
  const {
    query: {id}
  } = useRouter()

  return <>{id && <ArticleContainer id={id as string} />}</>
}

export default ArticleById
