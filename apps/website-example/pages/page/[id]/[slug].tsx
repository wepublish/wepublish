import {ApiV1, PageContainer, PageSEO} from '@wepublish/website'
import {GetStaticPaths, GetStaticProps} from 'next'
import getConfig from 'next/config'
import {useRouter} from 'next/router'

type PageBySlugProps = {
  page?: ApiV1.Page
}

export default function PageBySlug({page}: PageBySlugProps) {
  const {
    query: {slug}
  } = useRouter()

  return (
    <>
      {page && <PageSEO page={page} />}
      <PageContainer slug={slug as string} />
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [],
    fallback: true
  }
}

export const getStaticProps: GetStaticProps = async ({params}) => {
  const {slug} = params || {}
  const {publicRuntimeConfig} = getConfig()

  const client = ApiV1.getV1ApiClient(publicRuntimeConfig.env.API_URL!, [])
  const data = await client.query({
    query: ApiV1.PageDocument,
    variables: {
      slug
    }
  })

  return {
    props: {
      page: data?.data?.page
    },
    revalidate: 60 // every 60 seconds
  }
}
