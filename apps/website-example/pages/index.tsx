import {PageContainer, useUser, useWebsiteBuilder} from '@wepublish/website'

export function Index() {
  const {logout, user, hasUser} = useUser()
  const {
    elements: {H3, Button, Link}
  } = useWebsiteBuilder()

  return (
    <>
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

export default Index
