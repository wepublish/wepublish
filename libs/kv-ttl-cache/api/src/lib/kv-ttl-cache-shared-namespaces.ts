const SECRET_FIELD = /api_?key|secret|private_?key|password|token|credential/i;

export function assertSharedNamespaces<T extends readonly string[]>(
  namespaces: T
): T {
  const integrations = namespaces.filter(namespace =>
    namespace.startsWith('settings:')
  );

  if (integrations.length) {
    throw new Error(
      `Integration settings must never be stored in Dragonfly: ${integrations.join(
        ', '
      )}`
    );
  }

  return namespaces;
}

export const SHARED_NAMESPACES = assertSharedNamespaces([
  'auth:sessions',
  'settings',
  'website-settings',
  'navigations',
  'banners',
  'member-plans',
  'peer-profile',
  'peering:remote-profiles',
  'crowdfunding',
  'ga4',
  'graphql:responses',
  'graphql:comments',
  'content:articles',
  'content:pages',
  'content:authors',
  'content:images',
  'content:paywalls',
  'content:polls',
  'tracking-pixels',
] as const);

export const PUBLIC_CONTENT_NAMESPACE = 'graphql:content';

export const WEBSITE_PAGES_NAMESPACE = 'website:pages';

export const PAGE_CONTENT_NAMESPACES: readonly string[] = [
  PUBLIC_CONTENT_NAMESPACE,
  'navigations',
  'banners',
  'settings',
  'website-settings',
  'peer-profile',
  'member-plans',
  'peering:remote-profiles',
];

const pageContent = new Set<string>(PAGE_CONTENT_NAMESPACES);

export const isPageContentNamespace = (namespace: string) =>
  pageContent.has(namespace);

export const WEBSITE_LAYOUT_NAMESPACE = 'website:layout';

export const WEBSITE_LAYOUT_NAMESPACES: readonly string[] = [
  ...PAGE_CONTENT_NAMESPACES.filter(
    namespace => namespace !== PUBLIC_CONTENT_NAMESPACE
  ),
  'content:paywalls',
];

const websiteLayout = new Set<string>(WEBSITE_LAYOUT_NAMESPACES);

export const isWebsiteLayoutNamespace = (namespace: string) =>
  websiteLayout.has(namespace);

export const websitePathNamespace = (path: string) => `website:path:${path}`;

export const articlePagePaths = ({
  id,
  slug,
}: {
  id: string;
  slug?: string | null;
}) => [...(slug ? [`/a/${slug}`] : []), `/a/id/${id}`];

const shared = new Set<string>(SHARED_NAMESPACES);

export const isSharedNamespace = (namespace: string) => shared.has(namespace);

const isPublicBypassToken = (path: string[], key: string) =>
  key === 'token' && path.at(-2) === 'bypasses';

export function findSecretField(
  value: unknown,
  path: string[] = []
): string | undefined {
  if (value === null || typeof value !== 'object' || value instanceof Date) {
    return undefined;
  }

  for (const [key, child] of Object.entries(value)) {
    const childPath = [...path, key];

    if (
      !Array.isArray(value) &&
      SECRET_FIELD.test(key) &&
      child !== null &&
      child !== undefined &&
      child !== '' &&
      !isPublicBypassToken(path, key)
    ) {
      return childPath.join('.');
    }

    const found = findSecretField(child, childPath);

    if (found) {
      return found;
    }
  }

  return undefined;
}
