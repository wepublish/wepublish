import { forwardRef, Module } from '@nestjs/common';
import { BlockContentModule } from '../block-content.module';
import { PrismaModule } from '@wepublish/nest-modules';
import { BlockTemplateDataloaderService } from './block-template-dataloader.service';
import {
  BlockTemplateBlockResolver,
  BlockTemplateResolver,
} from './block-template.resolver';
import { BlockTemplateService } from './block-template.service';

@Module({
  imports: [PrismaModule, forwardRef(() => BlockContentModule)],
  providers: [
    BlockTemplateDataloaderService,
    BlockTemplateService,
    BlockTemplateResolver,
    BlockTemplateBlockResolver,
  ],
  exports: [BlockTemplateDataloaderService, BlockTemplateService],
})
export class BlockTemplateModule {}
