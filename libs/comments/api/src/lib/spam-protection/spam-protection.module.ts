import {DynamicModule, Module, ModuleMetadata, Provider, Type} from '@nestjs/common'
import {
  AKISMET_CLIENT_OPTIONS,
  AkismetConfig,
  AkismetSpamProtectionService
} from './spam-protection.service'
import {PrismaModule} from '@wepublish/nest-modules'

export type AkismetOptionsFactory = {
  createAkismetOptions(): Promise<AkismetConfig> | AkismetConfig
}

export interface AkismetAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<AkismetOptionsFactory>
  useClass?: Type<AkismetOptionsFactory>
  useFactory?: (...args: any[]) => Promise<AkismetConfig> | AkismetConfig
  inject?: any[]
}

@Module({
  imports: [PrismaModule],
  providers: [AkismetSpamProtectionService],
  exports: [AkismetSpamProtectionService]
})
export class AkismetSpamProtectionModule {
  public static register(config: AkismetConfig): DynamicModule {
    return {
      module: AkismetSpamProtectionModule,
      providers: [
        {
          provide: AKISMET_CLIENT_OPTIONS,
          useValue: config
        }
      ]
    }
  }

  public static registerAsync(options: AkismetAsyncOptions): DynamicModule {
    return {
      module: AkismetSpamProtectionModule,
      imports: options.imports || [],
      providers: this.createAsyncProviders(options)
    }
  }

  private static createAsyncProviders(options: AkismetAsyncOptions): Provider[] {
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

  private static createAsyncOptionsProvider(options: AkismetAsyncOptions): Provider {
    if (options.useFactory) {
      return {
        provide: AKISMET_CLIENT_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || []
      }
    }

    return {
      provide: AKISMET_CLIENT_OPTIONS,
      useFactory: async (optionsFactory: AkismetOptionsFactory) =>
        await optionsFactory.createAkismetOptions(),
      inject: [options.useExisting || options.useClass!]
    }
  }
}
