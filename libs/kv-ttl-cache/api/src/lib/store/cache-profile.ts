export type SharedCacheProfile = {
  name: string;
  shared: true;
  keyPrefix: string;
  localCopyMs?: number;
  scope?: 'release' | 'global';
};

export type LocalCacheProfile = {
  name: string;
  shared: false;
};

export type CacheProfile = SharedCacheProfile | LocalCacheProfile;
