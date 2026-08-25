import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { LetterJobService } from './letter-job.service';

/**
 * Drains the letter queue outside the daily periodic job: rendering a pdf and
 * three vendor calls per letter do not belong in that loop, and a failure must
 * not fail the whole day's run.
 */
@Injectable()
export class LetterJobExecutor {
  private readonly logger = new Logger('LetterJobExecutor');

  constructor(private letterJobService: LetterJobService) {}

  @Interval(60_000)
  async handleInterval(): Promise<void> {
    try {
      await this.letterJobService.drain();
    } catch (error) {
      this.logger.error(`Letter drain failed: ${(error as Error).message}`);
    }
  }
}
