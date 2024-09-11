import {Module} from '@nestjs/common'
import {BannerResolver} from './banner.resolver'
import {BannerService} from './banner.service'
import {PrismaModule} from '@wepublish/nest-modules'

@Module({
  controllers: [],
  providers: [BannerResolver, BannerService],
  exports: [PrismaModule]
})
export class BannerApiModule {}
