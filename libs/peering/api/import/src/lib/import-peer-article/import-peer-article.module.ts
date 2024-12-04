import {Module} from '@nestjs/common'
import {PrismaModule} from '@wepublish/nest-modules'
import {ImageFetcherModule} from '@wepublish/image/api'
import {ImportPeerArticleService} from './import-peer-article.service'
import {PeerModule} from '@wepublish/peering/api'
import {ImportPeerArticleResolver} from './import-peer-article.resolver'

@Module({
  imports: [PrismaModule, ImageFetcherModule, PeerModule, ImageFetcherModule],
  providers: [ImportPeerArticleService, ImportPeerArticleResolver],
  exports: [ImportPeerArticleService]
})
export class ImportPeerArticleModule {}
