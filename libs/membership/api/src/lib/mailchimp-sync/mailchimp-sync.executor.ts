import { Cron } from '@nestjs/schedule';
import { Injectable, Logger } from '@nestjs/common';
import { MailchimpSyncService } from './mailchimp-sync.service';

const SCHEDULE =
  process.env['MAILCHIMP_SYNC_EXECUTION_SCHEDULE'] || '0 0 4 * * *';

@Injectable()
export class MailchimpSyncExecutor {
  private logger = new Logger('MailchimpSyncExecutor');

  constructor(private mailchimpSyncService: MailchimpSyncService) {}

  @Cron(SCHEDULE, {
    disabled: !/[1-5]?[0-9] [1-5]?[0-9] [1-2]?[0-9] \* \* \*/.test(SCHEDULE),
  })
  async handleCron() {
    this.logger.log('Starting scheduled Mailchimp sync...');
    try {
      await this.mailchimpSyncService.executeAllSync();
      this.logger.log('Scheduled Mailchimp sync completed.');
    } catch (error) {
      this.logger.error('Scheduled Mailchimp sync failed:', error);
    }
  }
}
