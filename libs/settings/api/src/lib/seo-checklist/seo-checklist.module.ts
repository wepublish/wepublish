import { Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import { SeoChecklistResolver } from './seo-checklist.resolver';
import { SeoChecklistService } from './seo-checklist.service';

@Module({
  imports: [PrismaModule],
  providers: [SeoChecklistService, SeoChecklistResolver],
})
export class SeoChecklistModule {}
