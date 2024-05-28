import {Module} from '@nestjs/common'
import {AuthorService} from './author.service'
import {AuthorResolver} from './author.resolver'
import {PrismaModule} from '@wepublish/nest-modules'
import {AuthorDataloaderService} from './author-dataloader.service'
import {HasAuthorResolver, HasOptionalAuthorResolver} from './has-author/has-author.resolver'
import {AuthorDataloader} from './author.dataloader'

@Module({
  imports: [PrismaModule],
  providers: [
    AuthorService,
    AuthorResolver,
    AuthorDataloader,
    AuthorDataloaderService,
    HasAuthorResolver,
    HasOptionalAuthorResolver
  ],
  exports: [AuthorDataloaderService]
})
export class AuthorModule {}
