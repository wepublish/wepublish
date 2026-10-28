import { assertShareableNamespaces } from '@wepublish/kv-ttl-cache/api';
import { MEMBER_PLAN_CACHE_NAMESPACE } from '@wepublish/member-plan/api';
import { NAVIGATION_CACHE_NAMESPACE } from '@wepublish/navigation/api';
import {
  LOCAL_PEER_PROFILE_CACHE_NAMESPACE,
  REMOTE_PEER_PROFILE_CACHE_NAMESPACE,
} from '@wepublish/peering/api';
import {
  NAVIGATIONS_NAMESPACE,
  PAGE_CONTENT_NAMESPACES,
  PUBLIC_CONTENT_NAMESPACE,
  WEBSITE_LAYOUT_NAMESPACES,
  contentCacheNamespace,
} from '@wepublish/public-content-cache/api';
import {
  SETTINGS_CACHE_NAMESPACE,
  WEBSITE_SETTINGS_CACHE_NAMESPACE,
} from '@wepublish/settings/api';
import { API_SHARED_NAMESPACES } from './shared-namespaces';

describe('API_SHARED_NAMESPACES', () => {
  it('lists exactly the namespaces the API shares through Dragonfly', () => {
    expect(API_SHARED_NAMESPACES).toEqual([
      'content:articles',
      'content:pages',
      'content:authors',
      'content:images',
      'content:paywalls',
      'content:engagement',
      'content:polls',
      'graphql:comments',
      'settings',
      'website-settings',
      'navigations',
      'engagement:meters',
      'member-plans',
      'peer-profile',
      'peering:remote-profiles',
      'crowdfunding',
      'ga4',
      'tracking-pixels',
    ]);
  });

  it('never shares integration settings or lists a namespace twice', () => {
    expect(() =>
      assertShareableNamespaces(API_SHARED_NAMESPACES)
    ).not.toThrow();
  });
});

describe('website page namespaces', () => {
  it('rebuilds website pages under the namespaces their owners cache in', () => {
    expect(PAGE_CONTENT_NAMESPACES).toEqual([
      PUBLIC_CONTENT_NAMESPACE,
      NAVIGATION_CACHE_NAMESPACE,
      contentCacheNamespace('engagement'),
      SETTINGS_CACHE_NAMESPACE,
      WEBSITE_SETTINGS_CACHE_NAMESPACE,
      LOCAL_PEER_PROFILE_CACHE_NAMESPACE,
      MEMBER_PLAN_CACHE_NAMESPACE,
      REMOTE_PEER_PROFILE_CACHE_NAMESPACE,
    ]);
    expect(NAVIGATIONS_NAMESPACE).toBe(NAVIGATION_CACHE_NAMESPACE);
  });

  it('rebuilds the website layout under the namespaces their owners cache in', () => {
    expect(WEBSITE_LAYOUT_NAMESPACES).toEqual([
      NAVIGATION_CACHE_NAMESPACE,
      contentCacheNamespace('engagement'),
      SETTINGS_CACHE_NAMESPACE,
      WEBSITE_SETTINGS_CACHE_NAMESPACE,
      LOCAL_PEER_PROFILE_CACHE_NAMESPACE,
      MEMBER_PLAN_CACHE_NAMESPACE,
      REMOTE_PEER_PROFILE_CACHE_NAMESPACE,
      contentCacheNamespace('paywalls'),
    ]);
  });
});
