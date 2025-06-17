import {ProfilePage} from '@wepublish/utils/website'

export default function Profile() {
  return (
    <ProfilePage
      mediaEmail="info@wepublish.dev"
      trial={memberPlan => !!memberPlan?.tags?.includes('trial-subscription')}
    />
  )
}

Profile.getInitialProps = ProfilePage.getInitialProps
