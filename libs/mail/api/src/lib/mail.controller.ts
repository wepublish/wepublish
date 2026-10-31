import { Logger } from '@nestjs/common';
import { MailLogState, MailLogType, PrismaClient, User } from '@prisma/client';
import { v7 as uuidv7 } from 'uuid';
import { MailContext } from './mail-context';

export enum mailLogType {
  SubscriptionFlow,
  UserFlow,
  SystemMail,
  Manual,
}

/** Map the internal send-type enum to the persisted MailLog origin. */
const MAIL_LOG_TYPE_MAP: Record<mailLogType, MailLogType> = {
  [mailLogType.SubscriptionFlow]: MailLogType.subscriptionFlow,
  [mailLogType.UserFlow]: MailLogType.userFlow,
  [mailLogType.SystemMail]: MailLogType.systemMail,
  [mailLogType.Manual]: MailLogType.manual,
};

export type MailControllerConfig = {
  daysAwayFromEnding?: number | null;
  mailTemplateId: string;
  recipient: User;
  isRetry?: boolean;
  periodicJobRunDate?: Date | null;
  optionalData: Record<string, any>;
  mailType: mailLogType;
  /** Override the auto-generated login JWT with a custom token (e.g. password reset). */
  jwtOverride?: string;
  /** Set for mails produced by a manual bulk send job. */
  mailSendJobId?: string | null;
  /**
   * Id the mail log entry has to be written under. Passed in when the caller
   * needs to reference the entry regardless of how the delivery turns out.
   */
  mailLogId?: string;
};

/** What a user row carries that no template may ever print. */
const SECRET_FIELDS = new Set([
  'password',
  'roleIDs',
  'totpSecret',
  'totpEnabled',
  'totpExempt',
]);

/**
 * A copy of template data without a user's secrets, wherever a user row ended
 * up in it: the recipient, or a subscription's `user` relation the nightly job
 * hands in with the invoice. Only plain objects and arrays are walked; dates,
 * buffers and other instances are kept as they are.
 */
export function withoutSecrets<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(withoutSecrets) as T;
  }

  if (
    value !== null &&
    typeof value === 'object' &&
    Object.getPrototypeOf(value) === Object.prototype
  ) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !SECRET_FIELDS.has(key))
        .map(([key, nested]) => [key, withoutSecrets(nested)])
    ) as T;
  }

  return value;
}

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
    }-${this.config.daysAwayFromEnding}-${this.config.mailTemplateId}-${
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
  private async buildData() {
    // Cloned, so the caller's objects are not touched and no template sees a
    // user's secrets, nested ones included.
    const recipient = withoutSecrets(
      JSON.parse(JSON.stringify(this.config.recipient))
    );

    return {
      user: recipient,
      optional: withoutSecrets(this.config.optionalData),
      jwt:
        this.config.jwtOverride ??
        (await this.mailContext.jwtGenerator(recipient.id)),
      currentDate: new Date(),
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

    const mailLogId = this.config.mailLogId ?? uuidv7();

    let subject: string | null = null;
    let providerMessageID: string | undefined;
    try {
      ({ subject, providerMessageID } = await this.mailContext.sendComposedMail(
        {
          mailLogID: mailLogId,
          mailTemplateId: this.config.mailTemplateId,
          recipient: this.config.recipient.email,
          data: await this.buildData(),
        }
      ));
    } catch (error) {
      // A failed delivery must leave a trace too — otherwise the send job only
      // reports a count and the reason is lost outside the server log.
      await this.writeLog(
        mailLogId,
        MailLogState.rejected,
        subject,
        (error as Error).message
      );

      throw error;
    }

    await this.writeLog(
      mailLogId,
      MailLogState.submitted,
      subject,
      null,
      providerMessageID
    );
  }

  private async writeLog(
    mailLogId: string,
    state: MailLogState,
    subject: string | null,
    error: string | null,
    providerMessageID?: string
  ): Promise<void> {
    try {
      await this.prismaService.mailLog.create({
        data: {
          id: mailLogId,
          recipient: {
            connect: {
              id: this.config.recipient.id,
            },
          },
          state,
          sentDate: new Date(),
          mailProviderID: this.mailContext.mailProvider?.id || '',
          mailIdentifier: this.generateMailIdentifier(),
          type: MAIL_LOG_TYPE_MAP[this.config.mailType],
          subject,
          error,
          mailProviderMessageID: providerMessageID ?? null,
          mailTemplate: {
            connect: {
              id: this.config.mailTemplateId,
            },
          },
          ...(this.config.mailSendJobId ?
            { mailSendJob: { connect: { id: this.config.mailSendJobId } } }
          : {}),
        },
      });
    } catch (logError) {
      // Never let bookkeeping mask the delivery outcome.
      this.logger.error(
        `Could not write mail log <${mailLogId}>: ${
          (logError as Error).message
        }`
      );

      if (state !== MailLogState.rejected) {
        throw logError;
      }
    }
  }
}
