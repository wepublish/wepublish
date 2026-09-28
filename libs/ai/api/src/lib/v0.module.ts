import { DynamicModule, Module, ModuleMetadata } from '@nestjs/common';
import { V0Resolver } from './v0.resolver';
import { V0ClientService } from './v0-client.service';
import { SeoMetadataResolver } from './seo-metadata.resolver';
import { SeoMetadataService } from './seo-metadata.service';

@Module({
  providers: [
    V0ClientService,
    V0Resolver,
    SeoMetadataService,
    SeoMetadataResolver,
  ],
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
