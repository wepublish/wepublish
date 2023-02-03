import {Mutation, Query, Resolver} from '@nestjs/graphql'
import { MailTemplate } from '@prisma/client'
import { PrismaService, WithUrl } from '@wepublish/api'
import { MailProviderService } from './mail-provider.service'
import {MailTemplateSyncService} from './mail-template-sync.service'
import {computeUrl, MailTemplateWithUrl} from './mail-template.model'

@Resolver(of => MailTemplateWithUrl)
export class MailTemplatesResolver {
  constructor(
    private prismaService: PrismaService,
    private syncService: MailTemplateSyncService,
    private mailProviderService: MailProviderService,
  ) {}

  @Query(returns => [MailTemplateWithUrl])
  async mailTemplates() {
    const templates = await this.prismaService.mailTemplate.findMany()
    return this.decorate(templates)
  }

  @Mutation(returns => [MailTemplateWithUrl])
  async syncTemplates() {
    await this.syncService.synchronizeTemplates()
    const templates = await this.prismaService.mailTemplate.findMany()
    return this.decorate(templates)
  }

  private async decorate(templates: MailTemplate[]): Promise<WithUrl<MailTemplate>[]> {
    const provider = await this.mailProviderService.getProvider()
    return templates.map(t => computeUrl(t, provider))
  }
}
