import {Mutation, Query, Resolver} from '@nestjs/graphql'
import {MailTemplate} from '@prisma/client'
import {PrismaService, WithUrl} from '@wepublish/api'
import {MailProviderService} from './mail-provider.service'
import {MailTemplateSyncService} from './mail-template-sync.service'
import {computeUrl, MailProviderModel, MailTemplateWithUrlModel} from './mail-template.model'

@Resolver(of => MailTemplateWithUrlModel)
export class MailTemplatesResolver {
  constructor(
    private prismaService: PrismaService,
    private syncService: MailTemplateSyncService,
    private mailProviderService: MailProviderService
  ) {}

  @Query(returns => [MailTemplateWithUrlModel])
  async mailTemplates() {
    const templates = await this.prismaService.mailTemplate.findMany()
    return this.decorate(templates)
  }

  @Query(returns => MailProviderModel)
  async provider() {
    const provider = await this.mailProviderService.getProvider()
    return {name: provider.name}
  }

  @Mutation(returns => Boolean)
  async syncTemplates() {
    await this.syncService.synchronizeTemplates()
    return true
  }

  private async decorate(templates: MailTemplate[]): Promise<WithUrl<MailTemplate>[]> {
    const provider = await this.mailProviderService.getProvider()
    return templates.map(t => computeUrl(t, provider))
  }
}
