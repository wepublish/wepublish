import { Logger } from '@nestjs/common';
import { MailLogState, PrismaClient, User } from '@prisma/client';
import { generateJWT } from '@wepublish/utils/api';
import { randomUUID } from 'crypto';
import { MailContext } from './mail-context';

const ONE_WEEK_IN_MINUTES = 7 * 24 * 60 * 60;

export enum mailLogType {
  SubscriptionFlow,
  UserFlow,
  SystemMail,
}

export type MailControllerConfig = {
  daysAwayFromEnding?: number | null;
  externalMailTemplateId: string;
  recipient: User;
  isRetry?: boolean;
  periodicJobRunDate?: Date | null;
  optionalData: Record<string, any>;
  mailType: mailLogType;
};

export class MailController {
  private logger = new Logger('MailController');

  constructor(
    private prismaService: PrismaClient,
    private mailContext: MailContext,
    private config: MailControllerConfig
  ) {}

  /**
   * Build a string uniquely identifying the email delivery
   * @returns the identification string
   */
  private generateMailIdentifier() {
    return `${this.config.mailType}-${
      this.config.periodicJobRunDate ?
        this.config.periodicJobRunDate.toISOString()
      : 'null'
    }-${this.config.daysAwayFromEnding}-${this.config.externalMailTemplateId}-${
      this.config.recipient.id
    }`;
  }

  /**
   * Get the number of mails with the specified MailIdentifier. Any number > 0
   * means the mail was already sent.
   * @returns number of mails with this identifier
   */
  private async checkIfMailIsSent(): Promise<number> {
    return this.prismaService.mailLog.count({
      where: {
        mailIdentifier: this.generateMailIdentifier(),
      },
    });
  }

  /**
   * Build the data for passing it to the mail templates
   * @returns a HashMap of configuration data
   */
  private buildData() {
    // avoid unwanted data mutation by reference
    const recipient = JSON.parse(JSON.stringify(this.config.recipient));
    recipient.password = 'hidden';
    recipient.roleIDs = ['hidden'];

    if (!process.env['JWT_SECRET_KEY'])
      throw new Error('No JWT_SECRET_KEY defined in environment.');

    return {
      user: recipient,
      optional: this.config.optionalData,
      jwt: generateJWT({
        issuer: 'mailer',
        audience: 'audience',
        id: recipient.id,
        expiresInMinutes: ONE_WEEK_IN_MINUTES,
        secret: process.env['JWT_SECRET_KEY'],
      }),
    };
  }

  /**
   * Send an email using a specific template with the configured mail provider.
   * This method stores an entry in the MailLog table for referencing and
   * re-trying the delivery.
   * @returns void
   */
  public async sendMail(): Promise<void> {
    if (this.config.isRetry && (await this.checkIfMailIsSent())) {
      this.logger.warn(
        `Mail with id <${this.generateMailIdentifier()}> is already sent. Skipping...`
      );

      return;
    }

    const mailLogId = randomUUID();

    await this.mailContext.sendRemoteTemplateDirect({
      mailLogID: mailLogId,
      remoteTemplate: this.config.externalMailTemplateId,
      recipient: this.config.recipient.email,
      data: this.buildData(),
    });

    await this.prismaService.mailLog.create({
      data: {
        id: mailLogId,
        recipient: {
          connect: {
            id: this.config.recipient.id,
          },
        },
        state: MailLogState.submitted,
        sentDate: new Date(),
        mailProviderID: this.mailContext.mailProvider!.id || '',
        mailIdentifier: this.generateMailIdentifier(),
        mailTemplate: {
          connect: {
            externalMailTemplateId: this.config.externalMailTemplateId,
          },
        },
      },
    });
  }
}
