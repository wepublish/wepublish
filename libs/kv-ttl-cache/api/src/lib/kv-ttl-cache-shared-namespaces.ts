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
  'content:articles',
  'content:pages',
  'content:authors',
  'content:images',
  'content:paywalls',
  'tracking-pixels',
] as const);

const shared = new Set<string>(SHARED_NAMESPACES);

export const isSharedNamespace = (namespace: string) => shared.has(namespace);

export function findSecretField(
  value: unknown,
  path: string[] = []
): string | undefined {
  if (value === null || typeof value !== 'object' || value instanceof Date) {
    return undefined;
  }

  for (const [key, child] of Object.entries(value)) {
    const childPath = [...path, key];

    if (!Array.isArray(value) && SECRET_FIELD.test(key)) {
      return childPath.join('.');
    }

    const found = findSecretField(child, childPath);

    if (found) {
      return found;
    }
  }

  return undefined;
}
