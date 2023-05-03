import {Mutation, Query, Resolver} from '@nestjs/graphql'
import {MailTemplate} from '@prisma/client'
import {
  MailTemplateStatus,
  OldContextService,
  PrismaService,
  WithUrlAndStatus
} from '@wepublish/api'
import {MailTemplateSyncService} from './mail-template-sync.service'
import {MailProviderModel, MailTemplateWithUrlAndStatusModel} from './mail-template.model'
import {CanGetMailTemplates, CanSyncMailTemplates, Permissions} from '@wepublish/permissions/api'

@Resolver(() => MailTemplateWithUrlAndStatusModel)
export class MailTemplatesResolver {
  constructor(
    private prismaService: PrismaService,
    private syncService: MailTemplateSyncService,
    private oldContextService: OldContextService
  ) {}

  @Permissions(CanGetMailTemplates)
  @Query(() => [MailTemplateWithUrlAndStatusModel])
  async mailTemplates() {
    const templates = await this.prismaService.mailTemplate.findMany({
      orderBy: [{remoteMissing: 'asc'}, {id: 'asc'}]
    })
    return this.decorate(templates)
  }

  @Permissions(CanGetMailTemplates)
  @Query(() => MailProviderModel)
  async provider() {
    const provider = await this.oldContextService.context.mailContext.getProvider()
    return {name: provider.name}
  }

  @Permissions(CanSyncMailTemplates)
  @Mutation(() => Boolean, { nullable: true })
  async syncTemplates() {
    await this.syncService.synchronizeTemplates()
  }

  private async decorate(templates: MailTemplate[]): Promise<WithUrlAndStatus<MailTemplate>[]> {
    const provider = await this.oldContextService.context.mailContext.getProvider()
    const usedTemplates =
      await this.oldContextService.context.mailContext.getUsedTemplateIdentifiers()

    return templates.map(t => {
      let status = MailTemplateStatus.Ok

      if (!usedTemplates.includes(t.externalMailTemplateId)) {
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
