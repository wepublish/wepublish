import {Module} from '@nestjs/common'
import {CacheModule} from '@nestjs/cache-manager'
import {PrismaModule} from '@wepublish/nest-modules'
import {EventsImportResolver} from './import/events-import.resolver'
import {EventsImportService} from './import/events-import.service'
// import {AgendaBaselService} from './import/agenda-basel.service'

// const providers = [new AgendaBaselService()]

@Module({
  imports: [PrismaModule, CacheModule.register()],
  providers: [
    // {
    //   provide: 'EVENT_PROVIDERS',
    //   // useClass: AgendaBaselService
    //   // useValue: AgendaBaselService
    //   useFactory: agendaBasel => [agendaBasel],
    //   inject: [AgendaBaselService]
    // },
    EventsImportResolver,
    EventsImportService
  ]
})
export class EventsImportModule {}
