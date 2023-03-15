import {MailTemplateMap, OldContextService, PrismaService} from '@wepublish/api'
import {Injectable} from '@nestjs/common'
import {User} from '@wepublish/editor/api'
import {MailTemplate, MailLogState} from '@prisma/client'

export enum mailLogType {
  SubscriptionFlow,
  UserFlow
}

export type MailControllerConfig = {
  daysAwayFromEnding: number | null
  mailTemplate: MailTemplate
  recipient: User
  isRetry: boolean
  data: Record<string, any>
  mailType: mailLogType
}

@Injectable()
export class MailController {
  private sendDate: Date
  constructor(
    private readonly prismaService: PrismaService,
    private readonly oldContextService: OldContextService,
    private readonly config: MailControllerConfig
  ) {
    this.sendDate = new Date()
  }
  private generateMailIdentifier() {
    return `${this.config.mailType}-${this.sendDate.toISOString()}-${
      this.config.daysAwayFromEnding
    }-${this.config.mailTemplate.externalMailTemplateId}-${this.config.recipient}`
  }

  private async checkIfMailIsSent(): Promise<number> {
    return this.prismaService.mailLog.count({
      where: {
        mailIdentifier: this.generateMailIdentifier()
      }
    })
  }

  public async sendMail() {
    if (this.config.isRetry && (await this.checkIfMailIsSent())) {
      console.log(`Mail with id <${this.generateMailIdentifier()}> is already sent skipping...`)
      return
    }
    await oldContext.mailContext.sendRemoteTemplate({
      mailLogID: this.generateMailIdentifier(),
      remoteTemplate: this.config.mailTemplate.externalMailTemplateId,
      recipient: this.config.recipient.email,
      data: this.config.data
    })
    await this.prismaService.mailLog.create({
      data: {
        recipient: {
          connect: this.config.recipient
        },
        state: MailLogState.submitted,
        sentDate: this.sendDate,
        mailProviderID: oldContext.mailContext.mailProvider!.id || '',
        mailIdentifier: this.generateMailIdentifier(),
        mailTemplate: {
          connect: this.config.mailTemplate
        }
      }
    })
    console.log(
      `Sent template ${this.config.mailTemplate.externalMailTemplateId} to ${this.config.recipient.email}`
    )
  }
}
