import {DynamicModule, Module, ModuleMetadata, Provider, Type} from '@nestjs/common'
import {CacheModule} from '@nestjs/cache-manager'
import {PrismaModule} from '@wepublish/nest-modules'
import {EventsImportResolver} from './import/events-import.resolver'
import {
  EVENT_IMPORT_PROVIDER,
  EventsImportService,
  EventsProvider
} from './import/events-import.service'
import {AgendaBaselService} from './import/agenda-basel.service'
import {ImageFetcherModule} from '@wepublish/image/api'

export type EventsImportOptionsFactory = {
  createEventProviders(): Promise<EventsProvider[]> | EventsProvider[]
}

export interface EventsImportAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<EventsImportOptionsFactory>
  useClass?: Type<EventsImportOptionsFactory>
  useFactory?: (...args: unknown[]) => Promise<EventsProvider[]> | EventsProvider[]
  inject?: any[]
}

@Module({
  imports: [PrismaModule, CacheModule.register(), ImageFetcherModule],
  providers: [EventsImportResolver, EventsImportService, AgendaBaselService],
  exports: [AgendaBaselService]
})
export class EventsImportModule {
  public static register(config: EventsProvider[]): DynamicModule {
    return {
      module: EventsImportModule,
      providers: [
        {
          provide: EVENT_IMPORT_PROVIDER,
          useValue: config
        }
      ]
    }
  }

  public static registerAsync(options: EventsImportAsyncOptions): DynamicModule {
    return {
      module: EventsImportModule,
      imports: options.imports || [],
      providers: this.createAsyncProviders(options)
    }
  }

  private static createAsyncProviders(options: EventsImportAsyncOptions): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options)]
    }

    return [
      this.createAsyncOptionsProvider(options),
      {
        provide: options.useClass!,
        useClass: options.useClass!
      }
    ]
  }

  private static createAsyncOptionsProvider(options: EventsImportAsyncOptions): Provider {
    if (options.useFactory) {
      return {
        provide: EVENT_IMPORT_PROVIDER,
        useFactory: options.useFactory,
        inject: options.inject || []
      }
    }

    return {
      provide: EVENT_IMPORT_PROVIDER,
      useFactory: async (optionsFactory: EventsImportOptionsFactory) =>
        await optionsFactory.createEventProviders(),
      inject: [options.useExisting || options.useClass!]
    }
  }
}
