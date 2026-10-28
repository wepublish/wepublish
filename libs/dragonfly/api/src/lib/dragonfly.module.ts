import { DynamicModule, Global, Module } from '@nestjs/common';
import { createDragonflyConnection } from './create-dragonfly-connection';
import { DistributedClaims } from './distributed-claims';
import { DistributedCounters } from './distributed-counters';
import { DistributedLocks } from './distributed-locks';
import { DragonflyConnection } from './dragonfly-connection';
import { DragonflyHealth } from './dragonfly-health';
import {
  DRAGONFLY_OPTIONS,
  type DragonflyEnv,
  type DragonflyOptions,
  dragonflyOptionsFromEnv,
  RELEASE_ID,
} from './dragonfly-options';

export const DRAGONFLY_SERVICES = [
  DragonflyHealth,
  DistributedClaims,
  DistributedLocks,
  DistributedCounters,
];

@Global()
@Module({})
export class DragonflyModule {
  static forRoot({ env }: { env?: DragonflyEnv } = {}): DynamicModule {
    return {
      module: DragonflyModule,
      providers: [
        {
          provide: DRAGONFLY_OPTIONS,
          useFactory: () => dragonflyOptionsFromEnv(env ?? process.env),
        },
        {
          provide: RELEASE_ID,
          inject: [DRAGONFLY_OPTIONS],
          useFactory: (options: DragonflyOptions) => options.releaseId,
        },
        {
          provide: DragonflyConnection,
          inject: [DRAGONFLY_OPTIONS],
          useFactory: (options: DragonflyOptions) =>
            createDragonflyConnection(options),
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
