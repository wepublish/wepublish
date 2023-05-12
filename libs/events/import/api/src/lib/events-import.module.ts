import {Module} from '@nestjs/common'
import {CacheModule} from '@nestjs/cache-manager'
import {PrismaModule} from '@wepublish/nest-modules'
import {EventsImportResolver} from './import/events-import.resolver'
import {EventsImportService} from './import/events-import.service'

@Module({
  imports: [PrismaModule, CacheModule.register()],
  providers: [EventsImportResolver, EventsImportService]
})
export class EventsImportModule {}
