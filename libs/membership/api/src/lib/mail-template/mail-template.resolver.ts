import {
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { MailContext, MailTemplateStatus } from '@wepublish/mail/api';
import {
  CanGetMailTemplates,
  CanSyncMailTemplates,
} from '@wepublish/permissions';
import { MailTemplateSyncService } from './mail-template-sync.service';
import {
  MailProviderModel,
  MailTemplateWithUrlAndStatusModel,
} from './mail-template.model';
import { PrismaClient } from '@prisma/client';
import { Permissions } from '@wepublish/permissions/api';

@Resolver(() => MailTemplateWithUrlAndStatusModel)
export class MailTemplatesResolver {
  constructor(
    private prismaService: PrismaClient,
    private syncService: MailTemplateSyncService,
    private mailContext: MailContext
  ) {}

  @Permissions(CanGetMailTemplates)
  @Query(() => [MailTemplateWithUrlAndStatusModel], {
    description: `Return all mail templates`,
  })
  async mailTemplates() {
    const templates = await this.prismaService.mailTemplate.findMany({
      orderBy: [{ remoteMissing: 'asc' }, { id: 'asc' }],
    });

    return templates;
  }

  @Permissions(CanGetMailTemplates)
  @Query(() => MailProviderModel)
  async provider() {
    const provider = await this.mailContext.mailProvider;
    return { name: provider.getName() };
  }

  @Permissions(CanSyncMailTemplates)
  @Mutation(() => Boolean, { nullable: true })
  async syncTemplates() {
    await this.syncService.synchronizeTemplates();
  }

  @ResolveField('status', () => MailTemplateStatus, {
    description: 'Status of the template',
  })
  async status(
    @Parent() template: MailTemplateWithUrlAndStatusModel
  ): Promise<MailTemplateStatus> {
    const usedTemplates = await this.mailContext.getUsedTemplateIdentifiers();

    if (!usedTemplates.includes(template.externalMailTemplateId)) {
      return MailTemplateStatus.Unused;
    }

    if (template.remoteMissing) {
      return MailTemplateStatus.RemoteMissing;
    }

    return MailTemplateStatus.Ok;
  }

  @ResolveField('url', () => MailTemplateStatus, {
    description: 'External URL of the template',
  })
  async url(
    @Parent() template: MailTemplateWithUrlAndStatusModel
  ): Promise<string> {
    const provider = await this.mailContext.mailProvider;

    return provider.getTemplateUrl(template);
  }
}
