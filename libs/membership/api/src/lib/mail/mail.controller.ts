import {logger, OldContextService, PrismaService} from '@wepublish/api'
import {Injectable, Logger} from '@nestjs/common'
import {MailLogState, PrismaClient, User} from '@prisma/client'

export enum mailLogType {
  SubscriptionFlow,
  UserFlow
}

export type MailControllerConfig = {
  daysAwayFromEnding: number | null
  externalMailTemplateId: string
  recipient: User
  isRetry: boolean
  periodicJobRunDate: Date | null
  optionalData: Record<string, any>
  mailType: mailLogType
}

@Injectable()
export class MailController {
  private readonly logger = new Logger('MailController')
  constructor(
    private readonly prismaService: PrismaClient,
    private readonly oldContextService: OldContextService,
    private readonly config: MailControllerConfig
  ) {}
  private generateMailIdentifier() {
    return `${this.config.mailType}-${
      this.config.periodicJobRunDate ? this.config.periodicJobRunDate.toISOString() : 'null'
    }-${this.config.daysAwayFromEnding}-${this.config.externalMailTemplateId}-${
      this.config.recipient.id
    }`
  }

  private async checkIfMailIsSent(): Promise<number> {
    return this.prismaService.mailLog.count({
      where: {
        mailIdentifier: this.generateMailIdentifier()
      }
    })
  }

  private buildData() {
    this.config.recipient.password = 'hidden'
    this.config.recipient.roleIDs = ['hidden']

    return {
      user: this.config.recipient,
      optional: this.config.optionalData,
      jwt: this.oldContextService.context.generateJWT({
        id: this.generateMailIdentifier(),
        expiresInMinutes: 3600
      })
    }
  }

  public async sendMail() {
    if (this.config.isRetry && (await this.checkIfMailIsSent())) {
      this.logger.warn(
        `Mail with id <${this.generateMailIdentifier()}> is already sent skipping...`
      )
      return
    }

    await this.oldContextService.context.mailContext.sendRemoteTemplate({
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
        mailProviderID: oldContext.mailContext.mailProvider!.id || '',
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
