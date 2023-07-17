import {ApiV1, PageContainer, useUser, useWebsiteBuilder} from '@wepublish/website'

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
