import {Module} from '@nestjs/common'
import {AuthorService} from './author.service'
import {AuthorResolver} from './author.resolver'
import {PrismaModule} from '@wepublish/nest-modules'
import {AuthorDataloader} from './author.dataloader'

@Module({
  imports: [PrismaModule],
  providers: [AuthorService, AuthorResolver, AuthorDataloader]
})
export class AuthorModule {}
