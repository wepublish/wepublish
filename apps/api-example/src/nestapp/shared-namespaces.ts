import { BANNER_SHARED_NAMESPACES } from '@wepublish/banner/api';
import { CROWDFUNDING_SHARED_NAMESPACES } from '@wepublish/crowdfunding/api';
import { GOOGLE_ANALYTICS_SHARED_NAMESPACES } from '@wepublish/google-analytics/api';
import { MEMBER_PLAN_SHARED_NAMESPACES } from '@wepublish/member-plan/api';
import { NAVIGATION_SHARED_NAMESPACES } from '@wepublish/navigation/api';
import { PEERING_SHARED_NAMESPACES } from '@wepublish/peering/api';
import { PUBLIC_CONTENT_SHARED_NAMESPACES } from '@wepublish/public-content-cache/api';
import { SETTINGS_SHARED_NAMESPACES } from '@wepublish/settings/api';
import { TRACKING_PIXEL_SHARED_NAMESPACES } from '@wepublish/tracking-pixel/api';

export const API_SHARED_NAMESPACES: readonly string[] = [
  ...PUBLIC_CONTENT_SHARED_NAMESPACES,
  ...SETTINGS_SHARED_NAMESPACES,
  ...NAVIGATION_SHARED_NAMESPACES,
  ...BANNER_SHARED_NAMESPACES,
  ...MEMBER_PLAN_SHARED_NAMESPACES,
  ...PEERING_SHARED_NAMESPACES,
  ...CROWDFUNDING_SHARED_NAMESPACES,
  ...GOOGLE_ANALYTICS_SHARED_NAMESPACES,
  ...TRACKING_PIXEL_SHARED_NAMESPACES,
];
