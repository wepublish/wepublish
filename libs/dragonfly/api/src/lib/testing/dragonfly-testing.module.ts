import { DynamicModule, Global, Module } from '@nestjs/common';
import { DragonflyConnection } from '../dragonfly-connection';
import {
  DEV_RELEASE_ID,
  DRAGONFLY_OPTIONS,
  type DragonflyOptions,
  RELEASE_ID,
} from '../dragonfly-options';
import { DRAGONFLY_SERVICES } from '../dragonfly.module';
import { FakeDragonfly } from './fake-dragonfly';

@Global()
@Module({})
export class DragonflyTestingModule {
  static forRoot({
    connection,
    releaseId = DEV_RELEASE_ID,
  }: {
    connection?: DragonflyConnection;
    releaseId?: string;
  } = {}): DynamicModule {
    const options: DragonflyOptions = { production: false, releaseId };

    return {
      module: DragonflyTestingModule,
      providers: [
        { provide: DRAGONFLY_OPTIONS, useValue: options },
        { provide: RELEASE_ID, useValue: releaseId },
        {
          provide: DragonflyConnection,
          useValue: connection ?? new FakeDragonfly(),
        },
        ...DRAGONFLY_SERVICES,
      ],
      exports: [
        DRAGONFLY_OPTIONS,
        RELEASE_ID,
        DragonflyConnection,
        ...DRAGONFLY_SERVICES,
      ],
    };
  }
}
