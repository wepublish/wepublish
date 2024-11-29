import {Module} from '@nestjs/common'
import {PrismaModule} from '@wepublish/nest-modules'
import {AuthorDataloaderService} from './author-dataloader.service'

@Module({
  imports: [PrismaModule],
  providers: [AuthorDataloaderService],
  exports: [AuthorDataloaderService]
})
export class AuthorModule {}
