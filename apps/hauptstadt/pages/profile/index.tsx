import {PageContainer} from '@wepublish/page/website'
import {ProfilePage} from '@wepublish/utils/website'

import {HauptstadtContentFullWidth} from '../../src/components/hauptstadt-content-wrapper'

export default function Profile() {
  return (
    <PageContainer slug="profile">
      <HauptstadtContentFullWidth>
        <ProfilePage mediaEmail="info@wepublish.dev" />
      </HauptstadtContentFullWidth>
    </PageContainer>
  )
}

Profile.getInitialProps = ProfilePage.getInitialProps
