import {Module} from '@nestjs/common'
import {PrismaModule} from '@wepublish/nest-modules'
import {PeerDataloaderService} from './peer-dataloader.service'
import {HasPeerResolver} from './has-peer/has-peer.resolver'

@Module({
  imports: [PrismaModule],
  providers: [PeerDataloaderService, HasPeerResolver],
  exports: [PeerDataloaderService]
})
export class PeerModule {}
