import {ApiV1, PageContainer, PageSEO} from '@wepublish/website'
import {GetStaticPaths, GetStaticProps} from 'next'
import getConfig from 'next/config'
import {useRouter} from 'next/router'

type PageByIdProps = {
  page?: ApiV1.Page
}

export default function PageById({page}: PageByIdProps) {
  const {
    query: {id}
  } = useRouter()

  return (
    <>
      {page && <PageSEO page={page} />}
      <PageContainer id={id as string} />
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
  const {id} = params || {}
  const {publicRuntimeConfig} = getConfig()

  const client = ApiV1.getV1ApiClient(publicRuntimeConfig.env.API_URL!, [])
  const data = await client.query({
    query: ApiV1.PageDocument,
    variables: {
      id
    }
  })

  return {
    props: {
      page: data?.data?.page
    },
    revalidate: 60 // every 60 seconds
  }
}
