import { type CacheProfile } from '@wepublish/kv-ttl-cache/api';

export const PUBLIC_CONTENT_NAMESPACE = 'graphql:content';
export const PUBLIC_COMMENTS_NAMESPACE = 'graphql:comments';
export const NAVIGATIONS_NAMESPACE = 'navigations';

export const CONTENT_CACHE_TTL_SECONDS = 300;

export type PublicContent =
  | 'articles'
  | 'pages'
  | 'authors'
  | 'images'
  | 'paywalls'
  | 'engagement'
  | 'polls';

export const contentCacheNamespace = (content: PublicContent) =>
  `content:${content}`;

export const PAGE_CONTENT_NAMESPACES: readonly string[] = [
  PUBLIC_CONTENT_NAMESPACE,
  NAVIGATIONS_NAMESPACE,
  contentCacheNamespace('engagement'),
  'settings',
  'website-settings',
  'peer-profile',
  'member-plans',
  'peering:remote-profiles',
];

export const WEBSITE_LAYOUT_NAMESPACES: readonly string[] = [
  ...PAGE_CONTENT_NAMESPACES.filter(
    namespace => namespace !== PUBLIC_CONTENT_NAMESPACE
  ),
  contentCacheNamespace('paywalls'),
];

export const PUBLIC_CONTENT_SHARED_NAMESPACES: readonly string[] = [
  contentCacheNamespace('articles'),
  contentCacheNamespace('pages'),
  contentCacheNamespace('authors'),
  contentCacheNamespace('images'),
  contentCacheNamespace('paywalls'),
  contentCacheNamespace('engagement'),
  contentCacheNamespace('polls'),
  PUBLIC_COMMENTS_NAMESPACE,
];

export type ArticlePage = { id: string; slug?: string | null };

export const articlePagePaths = ({ id, slug }: ArticlePage) => [
  ...(slug ? [`/a/${slug}`] : []),
  `/a/id/${id}`,
];

export const GRAPHQL_RESPONSES_CACHE = Symbol('GRAPHQL_RESPONSES_CACHE');

export const GRAPHQL_RESPONSES_PROFILE: CacheProfile = {
  name: 'graphql:responses',
  shared: true,
  scope: 'release',
  keyPrefix: 'graphql:responses:',
};
