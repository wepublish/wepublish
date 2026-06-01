import {
  Args,
  ID,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import {
  getMailPlaceholderGroups,
  MailContext,
  MailTemplateStatus,
} from '@wepublish/mail/api';
import {
  CanCreateMailTemplates,
  CanDeleteMailTemplates,
  CanGetMailTemplates,
  CanSyncMailTemplates,
  CanUpdateMailTemplates,
} from '@wepublish/permissions';
import { MailTemplateSyncService } from './mail-template-sync.service';
import { MailTemplateService } from './mail-template.service';
import {
  MailPlaceholderGroupModel,
  MailProviderModel,
  MailTemplateContentModel,
  MailTemplateCreateInput,
  MailTemplateUpdateInput,
  MailTemplateWithUrlAndStatusModel,
} from './mail-template.model';
import { PrismaClient } from '@prisma/client';
import { Permissions } from '@wepublish/permissions/api';

@Resolver(() => MailTemplateWithUrlAndStatusModel)
export class MailTemplatesResolver {
  constructor(
    private prismaService: PrismaClient,
    private syncService: MailTemplateSyncService,
    private mailTemplateService: MailTemplateService,
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
  @Query(() => MailTemplateWithUrlAndStatusModel, {
    description: `Return a single mail template`,
  })
  async mailTemplate(@Args('id', { type: () => ID }) id: string) {
    return this.prismaService.mailTemplate.findUniqueOrThrow({
      where: { id },
    });
  }

  @Permissions(CanGetMailTemplates)
  @Query(() => [MailPlaceholderGroupModel], {
    description: `Return all available mail placeholders grouped by event`,
  })
  async mailTemplatePlaceholders() {
    return getMailPlaceholderGroups();
  }

  @Permissions(CanGetMailTemplates)
  @Query(() => MailProviderModel)
  async provider() {
    const provider = await this.mailContext.mailProvider;
    const config = await provider.getConfig();
    return { name: await provider.getName(), type: config?.type };
  }

  @Permissions(CanSyncMailTemplates)
  @Mutation(() => Boolean, { nullable: true })
  async syncTemplates() {
    await this.syncService.synchronizeTemplates();
  }

  @Permissions(CanCreateMailTemplates)
  @Mutation(() => MailTemplateWithUrlAndStatusModel)
  async createMailTemplate(@Args('input') input: MailTemplateCreateInput) {
    return this.mailTemplateService.create(input);
  }

  @Permissions(CanUpdateMailTemplates)
  @Mutation(() => MailTemplateWithUrlAndStatusModel)
  async updateMailTemplate(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: MailTemplateUpdateInput
  ) {
    return this.mailTemplateService.update(id, input);
  }

  @Permissions(CanDeleteMailTemplates)
  @Mutation(() => MailTemplateWithUrlAndStatusModel)
  async deleteMailTemplate(@Args('id', { type: () => ID }) id: string) {
    return this.mailTemplateService.delete(id);
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

  @ResolveField('content', () => MailTemplateContentModel, {
    description: 'HTML content of the template fetched from the mail provider',
  })
  async content(
    @Parent() template: MailTemplateWithUrlAndStatusModel
  ): Promise<MailTemplateContentModel> {
    if (template.remoteMissing) {
      return { html: '' };
    }

    return this.mailTemplateService.getContent(template);
  }
}
