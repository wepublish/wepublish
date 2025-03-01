import {Module} from '@nestjs/common'
import {PrismaModule} from '@wepublish/nest-modules'
import {AuthorDataloaderService} from './author-dataloader.service'
import {HasAuthorResolver, HasOptionalAuthorResolver} from './has-author/has-author.resolver'

@Module({
  imports: [PrismaModule],
  providers: [AuthorDataloaderService, HasAuthorResolver, HasOptionalAuthorResolver],
  exports: [AuthorDataloaderService]
})
export class AuthorModule {}
