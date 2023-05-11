import {Module} from '@nestjs/common'
import {CacheModule} from '@nestjs/cache-manager'
import {PrismaModule} from '@wepublish/nest-modules'
import {MediaAdapterModule} from '@wepublish/image/api'
import {EventsImportResolver} from './import/events-import.resolver'
import {EventsImportService} from './import/events-import.service'

@Module({
  imports: [PrismaModule, CacheModule.register(), MediaAdapterModule],
  providers: [EventsImportResolver, EventsImportService]
})
export class EventsImportModule {}
