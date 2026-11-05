import { Module } from '@nestjs/common';
import { ImageModule } from '@wepublish/image/api';
import { PrismaModule } from '@wepublish/nest-modules';
import { PublicContentInvalidatorModule } from '@wepublish/public-content-cache/api';
import { BlockStylesDataloaderService } from './block-styles-dataloader.service';
import { BlockStylesResolver } from './block-styles.resolver';
import { BlockStylesService } from './block-styles.service';

@Module({
  imports: [PublicContentInvalidatorModule, PrismaModule, ImageModule],
  providers: [
    BlockStylesDataloaderService,
    BlockStylesService,
    BlockStylesResolver,
  ],
  exports: [BlockStylesDataloaderService, BlockStylesService],
})
export class BlockStylesModule {}
