import {Mutation, Query, Resolver} from '@nestjs/graphql'
import {MailTemplateSyncService, PrismaService} from '@wepublish/api'
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
    await this.syncService.synchronizeTemplates()
    return this.prismaService.mailTemplate.findMany()
  }
}
