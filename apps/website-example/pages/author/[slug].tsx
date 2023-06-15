import {AuthorContainer} from '@wepublish/website'
import {useRouter} from 'next/router'

export function AuthorBySlug() {
  const {
    query: {slug}
  } = useRouter()

  return <>{slug && <AuthorContainer slug={slug as string} />}</>
}

export default AuthorBySlug
