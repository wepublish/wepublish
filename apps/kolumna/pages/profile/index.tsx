import {ProfilePage} from '@wepublish/utils/website'

export default function Profile() {
  return <ProfilePage mediaEmail="info@kolumna.org" />
}

Profile.getInitialProps = ProfilePage.getInitialProps
