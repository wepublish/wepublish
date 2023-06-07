import {ArticleContainer} from '@wepublish/website'
import {useRouter} from 'next/router'

export function ArticleBySlug() {
  const {
    query: {slug}
  } = useRouter()

  return <>{slug && <ArticleContainer slug={slug as string} />}</>
}

export default ArticleBySlug
