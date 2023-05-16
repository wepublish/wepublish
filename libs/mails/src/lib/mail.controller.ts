import {Injectable, Logger} from '@nestjs/common'
import {MailLogState, User} from '@prisma/client'
import {MailContext} from './mail-context'
import {PrismaService} from '@wepublish/nest-modules'
import {generateJWT} from '@wepublish/utils'

const ONE_WEEK_IN_MINUTES = 7 * 24 * 60 * 60

export enum mailLogType {
  SubscriptionFlow,
  UserFlow
}

export type MailControllerConfig = {
  daysAwayFromEnding?: number | null
  externalMailTemplateId: string
  recipient: User
  isRetry?: boolean
  periodicJobRunDate?: Date | null
  optionalData: Record<string, any>
  mailType: mailLogType
}

@Injectable()
export class MailController {
  private readonly logger = new Logger('MailController')

  constructor(
    private readonly prismaService: PrismaService,
    private readonly mailContext: MailContext,
    private readonly config: MailControllerConfig
  ) {}

  /**
   * Build a string uniquely identifying the email delivery
   * @returns the identification string
   */
  private generateMailIdentifier() {
    return `${this.config.mailType}-${
      this.config.periodicJobRunDate ? this.config.periodicJobRunDate.toISOString() : 'null'
    }-${this.config.daysAwayFromEnding}-${this.config.externalMailTemplateId}-${
      this.config.recipient.id
    }`
  }

  /**
   * Get the number of mails with the specified MailIdentifier. Any number > 0
   * means the mail was already sent.
   * @returns number of mails with this identifier
   */
  private async checkIfMailIsSent(): Promise<number> {
    return this.prismaService.mailLog.count({
      where: {
        mailIdentifier: this.generateMailIdentifier()
      }
    })
  }

  /**
   * Build the data for passing it to the mail templates
   * @returns a HashMap of configuration data
   */
  private buildData() {
    this.config.recipient.password = 'hidden'
    this.config.recipient.roleIDs = ['hidden']

    return {
      user: this.config.recipient,
      optional: this.config.optionalData,
      jwt: generateJWT({
        hostURL: 'mailer',
        audience: 'audience',
        id: this.generateMailIdentifier(),
        expiresInMinutes: ONE_WEEK_IN_MINUTES
      })
    }
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
        `Mail with id <${this.generateMailIdentifier()}> is already sent skipping...`
      )
      return
    }

    await this.mailContext.sendRemoteTemplateDirect({
      mailLogID: this.generateMailIdentifier(),
      remoteTemplate: this.config.externalMailTemplateId,
      recipient: this.config.recipient.email,
      data: this.buildData()
    })
    await this.prismaService.mailLog.create({
      data: {
        recipient: {
          connect: {
            id: this.config.recipient.id
          }
        },
        state: MailLogState.submitted,
        sentDate: new Date(),
        mailProviderID: this.mailContext.mailProvider!.id || '',
        mailIdentifier: this.generateMailIdentifier(),
        mailTemplate: {
          connect: {
            externalMailTemplateId: this.config.externalMailTemplateId
          }
        }
      }
    })
  }
}
