import {Module} from '@nestjs/common'
import {ImageModule} from '@wepublish/image/api'
import {PrismaModule} from '@wepublish/nest-modules'
import {UserDataloaderService} from './user-dataloader.service'
import {
  HasOptionalUserLcResolver,
  HasOptionalUserResolver,
  HasUserLcResolver,
  HasUserResolver
} from './has-user/has-user.resolver'
import {UserResolver} from './user.resolver'

@Module({
  imports: [PrismaModule, ImageModule],
  providers: [
    UserDataloaderService,
    HasUserResolver,
    HasUserLcResolver,
    HasOptionalUserResolver,
    HasOptionalUserLcResolver,
    UserResolver
  ],
  exports: [UserDataloaderService]
})
export class UserModule {}
