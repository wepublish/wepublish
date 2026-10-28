export const WEBSITE_PAGES_VERSION = 'website:pages';
export const WEBSITE_LAYOUT_VERSION = 'website:layout';
export const WEBSITE_HEARTBEAT_KEY = 'website:heartbeat';
export const RELEASE_KEY = 'release:current';

export const websitePathVersion = (path: string) =>
  `website:path:${path.toLowerCase()}`;

export const websitePagesKey = (kind: 'nsl' | 'nsf' | 'nsd' | 'nsw') =>
  `${kind}:${WEBSITE_PAGES_VERSION}`;
