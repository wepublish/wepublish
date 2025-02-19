import {Module} from '@nestjs/common'
import {PrismaModule} from '@wepublish/nest-modules'
import {PeerDataloaderService} from './peer-dataloader.service'
import {
  HasOptionalPeerLcResolver,
  HasOptionalPeerResolver,
  HasPeerLcResolver,
  HasPeerResolver
} from './has-peer/has-peer.resolver'

@Module({
  imports: [PrismaModule],
  providers: [
    PeerDataloaderService,
    HasPeerResolver,
    HasPeerLcResolver,
    HasOptionalPeerResolver,
    HasOptionalPeerLcResolver
  ],
  exports: [PeerDataloaderService]
})
export class PeerModule {}
