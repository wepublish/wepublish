import {PageContainer} from '@wepublish/page/website'
import {useRouter} from 'next/router'

export function PageById() {
  const {
    query: {id}
  } = useRouter()

  return <>{id && <PageContainer id={id as string} />}</>
}

export default PageById
