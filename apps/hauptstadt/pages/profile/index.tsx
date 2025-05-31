import {ContentWidthProvider} from '@wepublish/content/website'
import {PageContainer} from '@wepublish/page/website'
import {ProfilePage} from '@wepublish/utils/website'

export default function Profile() {
  return (
    <ContentWidthProvider fullWidth>
      <PageContainer slug="profile">
        <ProfilePage mediaEmail="info@wepublish.dev" />
      </PageContainer>
    </ContentWidthProvider>
  )
}

Profile.getInitialProps = ProfilePage.getInitialProps
