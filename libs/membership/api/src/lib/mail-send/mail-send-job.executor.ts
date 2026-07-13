import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { MailSendJobService } from './mail-send-job.service';

/**
 * Safety net for the fire-and-forget drain triggered when a job is created:
 * re-drains queued jobs (e.g. after a restart) and fails interrupted ones.
 */
@Injectable()
export class MailSendJobExecutor {
  private readonly logger = new Logger('MailSendJobExecutor');

  constructor(private mailSendJobService: MailSendJobService) {}

  @Interval(60_000)
  async handleInterval(): Promise<void> {
    try {
      await this.mailSendJobService.drain();
    } catch (error) {
      this.logger.error(`Mail send drain failed: ${(error as Error).message}`);
    }
  }
}
