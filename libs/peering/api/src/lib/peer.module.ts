import {
  DynamicModule,
  forwardRef,
  Module,
  Provider,
  Type,
} from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import { PeerDataloaderService } from './peer-dataloader.service';
import {
  HasOptionalPeerLcResolver,
  HasOptionalPeerResolver,
  HasPeerLcResolver,
  HasPeerResolver,
} from './has-peer/has-peer.resolver';
import { PeerService } from './peer.service';
import { PeerProfileService } from './peer-profile.service';
import { PeerResolver } from './peer.resolver';
import { PeerProfileResolver } from './peer-profile.resolver';
import { PEER_MODULE_OPTIONS, PeerModuleOptions } from './peer.constants';
import { ImageModule } from '@wepublish/image/api';
import { CacheModule } from '@nestjs/cache-manager';
import { RemotePeerProfileDataloaderService } from './remote-peer-profile.dataloader';
import { TokenResolver } from './token.resolver';
import { TokenService } from './token.service';

export interface PeerModuleAsyncOptions {
  imports?: Array<Type<any> | DynamicModule | Promise<DynamicModule>>;
  useFactory?: (
    ...args: any[]
  ) => Promise<PeerModuleOptions> | PeerModuleOptions;
  inject?: any[];
}

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => ImageModule),
    CacheModule.register(),
  ],
  providers: [
    {
      provide: PEER_MODULE_OPTIONS,
      useValue: {
        hostURL: 'http://localhost:4000',
        websiteURL: 'http://localhost:3000',
      },
    },
    PeerDataloaderService,
    RemotePeerProfileDataloaderService,
    PeerService,
    PeerProfileService,
    PeerResolver,
    PeerProfileResolver,
    HasPeerResolver,
    HasPeerLcResolver,
    HasOptionalPeerResolver,
    HasOptionalPeerLcResolver,
    TokenResolver,
    TokenService,
  ],
  exports: [PeerDataloaderService],
})
export class PeerModule {
  static register(options: PeerModuleOptions): DynamicModule {
    return {
      module: PeerModule,
      providers: [
        {
          provide: PEER_MODULE_OPTIONS,
          useValue: options,
        },
      ],
    };
  }

  static registerAsync(options: PeerModuleAsyncOptions): DynamicModule {
    return {
      module: PeerModule,
      imports: options.imports || [],
      providers: [this.createAsyncOptionsProvider(options)],
    };
  }

  private static createAsyncOptionsProvider(
    options: PeerModuleAsyncOptions
  ): Provider {
    if (!options.useFactory) {
      throw new Error('useFactory is required for registerAsync');
    }

    return {
      provide: PEER_MODULE_OPTIONS,
      useFactory: options.useFactory,
      inject: options.inject || [],
    };
  }
}
