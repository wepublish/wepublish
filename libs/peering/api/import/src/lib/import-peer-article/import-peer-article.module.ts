import { Module } from '@nestjs/common';
import { PrismaModule, URLAdapterModule } from '@wepublish/nest-modules';
import { ImageFetcherModule } from '@wepublish/image/api';
import { ImportPeerArticleService } from './import-peer-article.service';
import { PeerModule } from '@wepublish/peering/api';
import { ImportPeerArticleResolver } from './import-peer-article.resolver';
import { ArticleModule } from '@wepublish/article/api';

@Module({
  imports: [
    PrismaModule,
    ArticleModule,
    ImageFetcherModule,
    PeerModule,
    ImageFetcherModule,
    URLAdapterModule,
  ],
  providers: [ImportPeerArticleService, ImportPeerArticleResolver],
  exports: [ImportPeerArticleService],
})
export class ImportPeerArticleModule {}
