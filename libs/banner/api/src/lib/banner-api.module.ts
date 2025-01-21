import {Module} from '@nestjs/common'
import {BannerResolver} from './banner.resolver'
import {BannerService} from './banner.service'
import {PrismaModule} from '@wepublish/nest-modules'
import {BannerActionService} from './banner-action.service'

@Module({
  controllers: [],
  providers: [BannerResolver, BannerService, BannerActionService],
  imports: [PrismaModule]
})
export class BannerApiModule {}
