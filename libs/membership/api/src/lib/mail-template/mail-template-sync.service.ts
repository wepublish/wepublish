import {Injectable} from '@nestjs/common'
import {MailTemplate} from '@prisma/client'
import {MailProviderTemplate, OldContextService, PrismaService} from '@wepublish/api'

export interface MailTemplateSyncDiff {
  remoteNew: MailProviderTemplate[]
  remoteExisting: MailProviderTemplate[]
  localOutdated: MailTemplate[]
}

@Injectable()
export class MailTemplateSyncService {
  constructor(private prismaService: PrismaService, private oldContextService: OldContextService) {}

  async synchronizeTemplates(): Promise<void> {
    const localTemplates = await this.prismaService.mailTemplate.findMany()

    const mailProvider = await this.oldContextService.context.mailContext.getProvider()
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
            externalMailTemplateId: remoteTemplate.uniqueIdentifier,
            remoteMissing: false
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
