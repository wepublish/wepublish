import { Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import { LetterTemplatesResolver } from './letter-template.resolver';
import { LetterTemplateService } from './letter-template.service';

@Module({
  imports: [PrismaModule],
  providers: [LetterTemplatesResolver, LetterTemplateService],
})
export class LetterTemplateModule {}
