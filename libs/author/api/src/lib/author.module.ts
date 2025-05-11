import {Module} from '@nestjs/common'
import {AuthorService} from './author.service'
import {AuthorResolver} from './author.resolver'
import {PrismaModule} from '@wepublish/nest-modules'
import {HasAuthorResolver, HasOptionalAuthorResolver} from './has-author/has-author.resolver'
import {AuthorDataloader} from './author-dataloader'

@Module({
  imports: [PrismaModule],
  providers: [
    AuthorService,
    AuthorResolver,
    AuthorDataloader,
    HasAuthorResolver,
    HasOptionalAuthorResolver
  ],
  exports: [AuthorDataloader]
})
export class AuthorModule {}
