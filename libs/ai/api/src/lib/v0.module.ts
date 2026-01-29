import {
  DynamicModule,
  Module,
  ModuleMetadata,
} from '@nestjs/common';
import { V0Resolver } from './v0.resolver';

@Module({
  providers: [V0Resolver],
  exports: [V0Resolver],
})
export class V0Module {
  public static register(): DynamicModule {
    return {
      module: V0Module,
    };
  }

  public static registerAsync(
    options: Pick<ModuleMetadata, 'imports'>
  ): DynamicModule {
    return {
      module: V0Module,
      imports: options.imports || [],
    };
  }
}
