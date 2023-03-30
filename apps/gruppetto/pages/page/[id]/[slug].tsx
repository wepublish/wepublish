import {PageContainer} from '@wepublish/website'
import {useRouter} from 'next/router'

export function PageBySlug() {
  const {
    query: {slug}
  } = useRouter()

  return <>{slug && <PageContainer slug={slug as string} />}</>
}

export default PageBySlug
