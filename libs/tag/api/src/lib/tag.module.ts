import {Module} from '@nestjs/common'
import {PrismaModule} from '@wepublish/nest-modules'
import {TagResolver} from './tag.resolver'
import {TagService} from './tag.service'
import {TagDataloader} from './tag.dataloader'

@Module({
  imports: [PrismaModule],
  providers: [TagDataloader, TagService, TagResolver],
  exports: [TagService, TagDataloader]
})
export class TagModule {}
