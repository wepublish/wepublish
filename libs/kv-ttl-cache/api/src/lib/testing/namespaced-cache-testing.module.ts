import { type DynamicModule, Global, Module } from '@nestjs/common';
import { type DragonflyConnection } from '@wepublish/dragonfly/api';
import { DragonflyTestingModule } from '@wepublish/dragonfly/api/testing';
import { type DecimalCodec } from '../kv-ttl-cache-serializer';
import { NamespacedCacheModule } from '../namespaced/namespaced-cache.module';
import { KvCacheModule } from '../store/kv-cache.module';

export type NamespacedCacheTestingOptions = {
  connection?: DragonflyConnection;
  sharedNamespaces?: readonly string[];
  releaseId?: string;
  codec?: DecimalCodec;
};

@Global()
@Module({})
export class NamespacedCacheTestingModule {
  static forRoot({
    connection,
    sharedNamespaces,
    releaseId,
    codec,
  }: NamespacedCacheTestingOptions = {}): DynamicModule {
    const dragonfly = DragonflyTestingModule.forRoot({ connection, releaseId });
    const kvCache = KvCacheModule.forRoot({ codec });
    const namespacedCache = NamespacedCacheModule.forRoot({ sharedNamespaces });

    return {
      module: NamespacedCacheTestingModule,
      imports: [dragonfly, kvCache, namespacedCache],
      exports: [dragonfly, kvCache, namespacedCache],
    };
  }
}
