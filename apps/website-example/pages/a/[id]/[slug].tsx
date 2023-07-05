import {ApiV1, ArticleContainer, ArticleSEO} from '@wepublish/website'
import {GetStaticPaths, GetStaticProps} from 'next'
import getConfig from 'next/config'
import {useRouter} from 'next/router'

type ArticleBySlugProps = {
  article?: ApiV1.Article
}

export default function ArticleBySlug({article}: ArticleBySlugProps) {
  const {
    query: {slug}
  } = useRouter()

  return (
    <>
      {article && <ArticleSEO article={article} />}
      <ArticleContainer slug={slug as string} />
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
    query: ApiV1.ArticleDocument,
    variables: {
      slug
    }
  })

  return {
    props: {
      article: data?.data?.article
    },
    revalidate: 60 // every 60 seconds
  }
}
