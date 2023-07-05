import {ApiV1, ArticleContainer, ArticleSEO} from '@wepublish/website'
import {GetStaticPaths, GetStaticProps} from 'next'
import getConfig from 'next/config'
import {useRouter} from 'next/router'

type ArticleByIdProps = {
  article?: ApiV1.Article
}

export default function ArticleById({article}: ArticleByIdProps) {
  const {
    query: {id}
  } = useRouter()

  return (
    <>
      {article && <ArticleSEO article={article} />}
      <ArticleContainer id={id as string} />
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
    query: ApiV1.ArticleDocument,
    variables: {
      id
    }
  })

  return {
    props: {
      article: data?.data?.article
    },
    revalidate: 60 // every 60 seconds
  }
}
