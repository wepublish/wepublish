import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { KvTtlCacheModule } from '@wepublish/kv-ttl-cache/api';
import { PrismaModule } from '@wepublish/nest-modules';

import { ZettelkastenClientService } from './zettelkasten-client.service';
import { ZettelkastenConfig } from './zettelkasten-config';
import { ZettelkastenResolver } from './zettelkasten.resolver';

@Module({
  imports: [PrismaModule, KvTtlCacheModule, HttpModule],
  providers: [
    ZettelkastenConfig,
    ZettelkastenClientService,
    ZettelkastenResolver,
  ],
  exports: [ZettelkastenClientService],
})
export class ZettelkastenModule {}
