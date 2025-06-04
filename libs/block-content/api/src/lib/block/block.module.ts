import {Module} from '@nestjs/common'
import {ImageBlockResolver} from './image-block.resolver'

@Module({
  imports: [],
  providers: [ImageBlockResolver]
})
export class BlockModule {}
