import { Test, type TestingModule } from '@nestjs/testing';
import { DragonflyConnection } from '@wepublish/dragonfly/api';
import { NamespacedCache } from '../namespaced/namespaced-cache';
import { NamespaceResets } from '../versions/namespace-resets';
import { NamespaceVersions } from '../versions/namespace-versions';
import {
  NamespacedCacheTestingModule,
  type NamespacedCacheTestingOptions,
} from './namespaced-cache-testing.module';

export type NamespacedCacheTesting = {
  module: TestingModule;
  cache: NamespacedCache;
  resets: NamespaceResets;
  versions: NamespaceVersions;
  connection: DragonflyConnection;
  close(): Promise<void>;
};

export async function createNamespacedCacheTesting(
  options?: NamespacedCacheTestingOptions
): Promise<NamespacedCacheTesting> {
  const module = await Test.createTestingModule({
    imports: [NamespacedCacheTestingModule.forRoot(options)],
  }).compile();
  await module.init();

  return {
    module,
    cache: module.get(NamespacedCache),
    resets: module.get(NamespaceResets),
    versions: module.get(NamespaceVersions),
    connection: module.get(DragonflyConnection),
    close: () => module.close(),
  };
}
