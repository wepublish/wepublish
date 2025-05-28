import {PageContainer} from '@wepublish/page/website'
import {ProfilePage} from '@wepublish/utils/website'

export default function Profile() {
  return (
    <PageContainer slug="profile">
      <ProfilePage mediaEmail="info@wepublish.dev" />
    </PageContainer>
  )
}

Profile.getInitialProps = ProfilePage.getInitialProps
