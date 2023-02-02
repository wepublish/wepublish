import {Injectable} from '@nestjs/common'
import {MailTemplate} from '@prisma/client'
import {MailProviderTemplate, PrismaService} from '@wepublish/api'
import {MailProviderService} from './mail-provider.service'

export interface MailTemplateSyncDiff {
  remoteNew: MailProviderTemplate[]
  remoteExisting: MailProviderTemplate[]
  localOutdated: MailTemplate[]
}

@Injectable()
export class MailTemplateSyncService {
  constructor(
    private prismaService: PrismaService,
    private mailProviderService: MailProviderService
  ) {}

  async synchronizeTemplates(): Promise<void> {
    const localTemplates = await this.prismaService.mailTemplate.findMany()

    const mailProvider = await this.mailProviderService.getProvider()
    const remoteTemplates = (await mailProvider.getTemplates()) as MailProviderTemplate[]

    // find new and updated remote templates
    for (const remoteTemplate of remoteTemplates) {
      const localMatch = localTemplates.find(
        localTemplate => localTemplate.externalMailTemplateId === remoteTemplate.uniqueIdentifier
      )
      if (localMatch) {
        // template exists locally, update properties
        await this.prismaService.mailTemplate.update({
          where: {externalMailTemplateId: remoteTemplate.uniqueIdentifier},
          data: {
            name: remoteTemplate.name,
            remoteMissing: false
          }
        })
      } else {
        // template is new
        await this.prismaService.mailTemplate.create({
          data: {
            name: remoteTemplate.name,
            externalMailTemplateId: remoteTemplate.uniqueIdentifier
          }
        })
      }
    }

    // find outdated local templates
    for (const localTemplate of localTemplates) {
      const remoteMatch = remoteTemplates.find(
        remoteTemplate => remoteTemplate.uniqueIdentifier === localTemplate.externalMailTemplateId
      )
      if (!remoteMatch) {
        // template was deleted remotely
        await this.prismaService.mailTemplate.update({
          where: {externalMailTemplateId: localTemplate.externalMailTemplateId},
          data: {
            remoteMissing: true
          }
        })
      }
    }
  }
}
