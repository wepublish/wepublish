import { Module } from '@nestjs/common';
import { KvTtlCacheCoreModule } from './kv-ttl-cache-core.module';
import { prismaDecimalCodec } from './kv-ttl-cache-prisma-decimal';

@Module({
  imports: [KvTtlCacheCoreModule.register({ decimal: prismaDecimalCodec })],
  exports: [KvTtlCacheCoreModule],
})
export class KvTtlCacheModule {}
