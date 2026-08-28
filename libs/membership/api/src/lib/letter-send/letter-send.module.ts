import { Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import { LetterJobExecutor } from './letter-job.executor';
import { LetterJobService } from './letter-job.service';
import { LetterPreviewService } from './letter-preview.service';
import { LetterSendResolver } from './letter-send.resolver';

@Module({
  imports: [PrismaModule],
  providers: [
    LetterJobService,
    LetterJobExecutor,
    LetterPreviewService,
    LetterSendResolver,
  ],
  exports: [LetterJobService],
})
export class LetterSendModule {}
