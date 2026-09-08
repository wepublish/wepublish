import { Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import { BlockTemplateDataloaderService } from './block-template-dataloader.service';
import {
  BlockTemplateBlockResolver,
  BlockTemplateResolver,
} from './block-template.resolver';
import { BlockTemplateService } from './block-template.service';

@Module({
  imports: [PrismaModule],
  providers: [
    BlockTemplateDataloaderService,
    BlockTemplateService,
    BlockTemplateResolver,
    BlockTemplateBlockResolver,
  ],
  exports: [BlockTemplateDataloaderService, BlockTemplateService],
})
export class BlockTemplateModule {}
