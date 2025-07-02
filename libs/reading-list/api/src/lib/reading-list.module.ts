import {Module} from '@nestjs/common'
import {PrismaModule} from '@wepublish/nest-modules'
import {ReadingListResolver} from './reading-list.resolver'
import {ReadingListService} from './reading-list.service'
import {ArticleModule} from '@wepublish/article/api'

@Module({
  imports: [PrismaModule, ArticleModule],
  providers: [ReadingListService, ReadingListResolver],
  exports: [ReadingListService]
})
export class ReadingListModule {}
