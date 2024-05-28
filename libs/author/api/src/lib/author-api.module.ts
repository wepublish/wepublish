import {Module} from '@nestjs/common'
import {AuthorService} from './author.service'
import {AuthorResolver} from './author.resolver'
import {PrismaModule} from '@wepublish/nest-modules'

@Module({
  imports: [PrismaModule],
  providers: [AuthorService, AuthorResolver]
})
export class AuthorModule {}
