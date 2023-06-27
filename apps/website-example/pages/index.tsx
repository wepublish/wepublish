import {ApiV1, PageContainer, useUser, useWebsiteBuilder} from '@wepublish/website'
import {GetStaticProps} from 'next'
import getConfig from 'next/config'

type IndexProps = {
  page?: ApiV1.Page
}

export default function Index({page}: IndexProps) {
  const {logout, user, hasUser} = useUser()
  const {
    elements: {H3, Button, Link},
    PageSEO
  } = useWebsiteBuilder()

  return (
    <>
      {page && <PageSEO page={page} />}

      {user && (
        <div>
          <H3 component="h3">👋 {user?.firstName}</H3>
          <Button onClick={logout}>Logout</Button>
        </div>
      )}

      {!hasUser && <Link href="/login">Login</Link>}

      <PageContainer slug="" />
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const {publicRuntimeConfig} = getConfig()

  const client = ApiV1.getV1ApiClient(publicRuntimeConfig.env.API_URL!, [])
  const data = await client.query({
    query: ApiV1.PageDocument,
    variables: {
      slug: ''
    }
  })

  return {
    props: {
      page: data?.data?.page
    },
    revalidate: 60 // every 60 seconds
  }
}
