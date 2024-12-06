import {Module} from '@nestjs/common'
import {ImageModule} from '@wepublish/image/api'
import {PrismaModule} from '@wepublish/nest-modules'
import {UserDataloaderService} from './user-dataloader.service'
import {HasUserResolver} from './has-user/has-user.resolver'

@Module({
  imports: [PrismaModule, ImageModule],
  providers: [UserDataloaderService, HasUserResolver],
  exports: [UserDataloaderService]
})
export class UserModule {}
