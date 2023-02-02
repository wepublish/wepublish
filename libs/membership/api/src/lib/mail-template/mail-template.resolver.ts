import {Mutation, Query, Resolver} from '@nestjs/graphql'
import {PrismaService} from '@wepublish/api'
import {MailTemplateSyncService} from './mail-template-sync.service'
import {MailTemplate} from './mail-template.model'

@Resolver(of => MailTemplate)
export class MailTemplatesResolver {
  constructor(private prismaService: PrismaService, private syncService: MailTemplateSyncService) {}

  @Query(returns => [MailTemplate])
  async mailTemplates() {
    return this.prismaService.mailTemplate.findMany()
  }

  @Mutation(returns => [MailTemplate])
  async syncTemplates() {
    const diff = await this.syncService.synchronizeTemplates()

    for (const remoteTemplate of diff.remoteNew) {
      // template is new
      await this.prismaService.mailTemplate.create({
        data: {
          name: remoteTemplate.name,
          externalMailTemplateId: remoteTemplate.uniqueIdentifier
        }
      })
    }
    for (const remoteTemplate of diff.remoteExisting) {
      // template exists locally, update properties
      await this.prismaService.mailTemplate.update({
        where: {externalMailTemplateId: remoteTemplate.uniqueIdentifier},
        data: {
          name: remoteTemplate.name,
          remoteMissing: false
        }
      })
    }
    for (const localTemplate of diff.localOutdated) {
      // template was deleted remotely
      await this.prismaService.mailTemplate.update({
        where: {externalMailTemplateId: localTemplate.externalMailTemplateId},
        data: {
          remoteMissing: true
        }
      })
    }

    return this.prismaService.mailTemplate.findMany()
  }
}
