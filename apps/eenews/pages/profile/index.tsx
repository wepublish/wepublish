import { ProfilePage, withAuthGuard } from '@wepublish/utils/website';
import { NextPage } from 'next';

import { EenewsProfile } from '../../src/components/eenews-profile';

const Profile = withAuthGuard(EenewsProfile) as NextPage;
Profile.getInitialProps = ProfilePage.getInitialProps;

export default Profile;
