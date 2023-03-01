import {Mutation, Query, Resolver} from '@nestjs/graphql'
import {MailTemplate} from '@prisma/client'
import {MailTemplateStatus, PrismaService, WithUrlAndStatus} from '@wepublish/api'
import {MailProviderService} from './mail-provider.service'
import {MailTemplateSyncService} from './mail-template-sync.service'
import {MailProviderModel, MailTemplateWithUrlAndStatusModel} from './mail-template.model'

@Resolver(() => MailTemplateWithUrlAndStatusModel)
export class MailTemplatesResolver {
  constructor(
    private prismaService: PrismaService,
    private syncService: MailTemplateSyncService,
    private mailProviderService: MailProviderService
  ) {}

  @Query(() => [MailTemplateWithUrlAndStatusModel])
  async mailTemplates() {
    const templates = await this.prismaService.mailTemplate.findMany({
      orderBy: {
        id: 'asc'
      }
    })
    return this.decorate(templates)
  }

  @Query(() => MailProviderModel)
  async provider() {
    const provider = await this.mailProviderService.getProvider()
    return {name: provider.name}
  }

  @Mutation(() => Boolean)
  async syncTemplates() {
    await this.syncService.synchronizeTemplates()
    return true
  }

  private async decorate(templates: MailTemplate[]): Promise<WithUrlAndStatus<MailTemplate>[]> {
    const provider = await this.mailProviderService.getProvider()
    const usedTemplates = await this.mailProviderService.getUsedTemplateIdentifiers()

    return templates.map(t => {
      let status = MailTemplateStatus.Ok

      if (usedTemplates.indexOf(t.externalMailTemplateId) === -1) {
        status = MailTemplateStatus.Unused
      }

      if (t.remoteMissing) {
        status = MailTemplateStatus.RemoteMissing
      }

      return {
        ...t,
        url: provider.getTemplateUrl(t),
        status
      }
    })
  }
}
