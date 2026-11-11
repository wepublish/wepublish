import { type DynamicModule, Global, Module } from '@nestjs/common';
import { KvCacheModule } from '../store/kv-cache.module';
import { CatchUpScheduler } from '../versions/catch-up-scheduler';
import { NamespaceResets } from '../versions/namespace-resets';
import {
  NamespaceVersions,
  VERSION_REFRESH_MS,
} from '../versions/namespace-versions';
import { OutagePeriod } from '../versions/outage-period';
import { LoadCoordinator } from './load-coordinator';
import {
  LOCAL_CACHE,
  NamespaceCaches,
  SHARED_CACHE,
  SHARED_NAMESPACES,
} from './namespace-caches';
import { NamespacedCache } from './namespaced-cache';
import { VersionedCache } from './versioned-cache';

export function assertShareableNamespaces(namespaces: readonly string[]): void {
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

  const duplicates = namespaces.filter(
    (namespace, index) => namespaces.indexOf(namespace) !== index
  );

  if (duplicates.length) {
    throw new Error(
      `Shared namespaces must be listed once: ${[...new Set(duplicates)].join(
        ', '
      )}`
    );
  }
}

@Global()
@Module({})
export class NamespacedCacheModule {
  static forRoot({
    sharedNamespaces = [],
  }: { sharedNamespaces?: readonly string[] } = {}): DynamicModule {
    assertShareableNamespaces(sharedNamespaces);

    return {
      module: NamespacedCacheModule,
      imports: [
        KvCacheModule.forFeature(SHARED_CACHE, {
          name: 'shared',
          shared: true,
          localCopyMs: VERSION_REFRESH_MS,
          scope: 'release',
          keyPrefix: '',
        }),
        KvCacheModule.forFeature(LOCAL_CACHE, {
          name: 'local',
          shared: false,
        }),
      ],
      providers: [
        { provide: SHARED_NAMESPACES, useValue: new Set(sharedNamespaces) },
        NamespaceVersions,
        CatchUpScheduler,
        OutagePeriod,
        NamespaceResets,
        NamespaceCaches,
        LoadCoordinator,
        VersionedCache,
        { provide: NamespacedCache, useExisting: VersionedCache },
      ],
      exports: [
        NamespaceVersions,
        CatchUpScheduler,
        NamespaceResets,
        NamespacedCache,
      ],
    };
  }
}
