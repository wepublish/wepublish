import {Module} from '@nestjs/common'
import {EventModule} from '@wepublish/event/api'
import {EventTeaserResolver} from './resolver/event-teaser.resolver'

@Module({
  imports: [EventModule],
  providers: [EventTeaserResolver]
})
export class BlockModule {}
