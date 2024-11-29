import {Module} from '@nestjs/common'
import {PrismaModule} from '@wepublish/nest-modules'
import {ImageFetcherModule} from '@wepublish/image/api'
import {ImportPeerArticleService} from './import-peer-article.service'
import {PeerModule} from '@wepublish/peering/api'

@Module({
  imports: [PrismaModule, ImageFetcherModule, PeerModule],
  providers: [ImportPeerArticleService],
  exports: [ImportPeerArticleService]
})
export class ImportPeerArticleModule {}
