import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import {
  MailContext,
  MailTemplateStatus,
  PlaceholderService,
} from '@wepublish/mail/api';
import {
  CanCreateMailTemplates,
  CanDeleteMailTemplates,
  CanGetMailTemplates,
  CanSyncMailTemplates,
  CanUpdateMailTemplates,
} from '@wepublish/permissions';
import { MailTemplateSyncService } from './mail-template-sync.service';
import {
  CreateMailTemplateInput,
  MailPlaceholderGroupModel,
  MailPlaceholderModel,
  MailProviderModel,
  MailTemplateContentModel,
  MailTemplateWithUrlAndStatusModel,
  UpdateMailTemplateInput,
} from './mail-template.model';
import { PrismaClient } from '@prisma/client';
import { Permissions } from '@wepublish/permissions/api';
import { BadRequestException, NotFoundException } from '@nestjs/common';

@Resolver(() => MailTemplateWithUrlAndStatusModel)
export class MailTemplatesResolver {
  constructor(
    private prismaService: PrismaClient,
    private syncService: MailTemplateSyncService,
    private mailContext: MailContext,
    private placeholderService: PlaceholderService
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
  @Query(() => MailTemplateContentModel, {
    description:
      'Return a mail template including the HTML body from the provider',
  })
  async mailTemplate(
    @Args('id') id: string
  ): Promise<MailTemplateContentModel> {
    const local = await this.prismaService.mailTemplate.findUnique({
      where: { id },
    });
    if (!local) {
      throw new NotFoundException(`Mail template ${id} not found`);
    }
    const provider = this.mailContext.mailProvider;
    const remote = await provider.getTemplate(local.externalMailTemplateId);
    return {
      id: local.id,
      name: local.name,
      externalMailTemplateId: local.externalMailTemplateId,
      description: local.description ?? undefined,
      subject: remote.subject ?? undefined,
      html: remote.html,
    };
  }

  @Permissions(CanGetMailTemplates)
  @Query(() => MailProviderModel)
  async provider(): Promise<MailProviderModel> {
    const provider = this.mailContext.mailProvider;
    return {
      name: await provider.getName(),
      capabilities: provider.getCapabilities(),
      placeholderSyntax: provider.getPlaceholderSyntax(),
    };
  }

  @Permissions(CanGetMailTemplates)
  @Query(() => [MailPlaceholderModel], {
    description: 'The placeholders available in every template (user_* + jwt).',
  })
  async alwaysAvailablePlaceholders(): Promise<MailPlaceholderModel[]> {
    return this.placeholderService.getAlwaysAvailablePlaceholders().map(p => ({
      key: p.key,
      description: p.description,
      scope: p.scope,
      event: p.event ?? undefined,
    }));
  }

  @Permissions(CanGetMailTemplates)
  @Query(() => [MailPlaceholderGroupModel], {
    description:
      'All placeholders grouped by mail event. Programmatically derived from the Prisma data model so no field is forgotten.',
  })
  async mailTemplatePlaceholderGroups(): Promise<MailPlaceholderGroupModel[]> {
    return this.placeholderService.getAllEventPlaceholders().map(group => ({
      scope: group.scope,
      event: group.event,
      placeholders: group.placeholders.map(p => ({
        key: p.key,
        description: p.description,
        scope: p.scope,
        event: p.event ?? undefined,
      })),
    }));
  }

  @Permissions(CanSyncMailTemplates)
  @Mutation(() => Boolean, { nullable: true })
  async syncTemplates() {
    await this.syncService.synchronizeTemplates();
  }

  @Permissions(CanCreateMailTemplates)
  @Mutation(() => MailTemplateWithUrlAndStatusModel)
  async createMailTemplate(
    @Args('input') input: CreateMailTemplateInput
  ): Promise<MailTemplateWithUrlAndStatusModel> {
    const provider = this.mailContext.mailProvider;
    if (!provider.getCapabilities().canCreateTemplates) {
      throw new BadRequestException(
        'The active mail provider does not support creating templates.'
      );
    }
    if (!input.name?.trim()) {
      throw new BadRequestException('Template name is required.');
    }

    const remote = await provider.createTemplate({
      name: input.name.trim(),
      html: input.html ?? '',
      subject: input.subject ?? null,
    });

    const local = await this.prismaService.mailTemplate.upsert({
      where: { externalMailTemplateId: remote.uniqueIdentifier },
      create: {
        name: remote.name,
        description: input.description,
        externalMailTemplateId: remote.uniqueIdentifier,
        remoteMissing: false,
      },
      update: {
        name: remote.name,
        description: input.description,
        remoteMissing: false,
      },
    });
    return local as unknown as MailTemplateWithUrlAndStatusModel;
  }

  @Permissions(CanUpdateMailTemplates)
  @Mutation(() => MailTemplateWithUrlAndStatusModel)
  async updateMailTemplate(
    @Args('id') id: string,
    @Args('input') input: UpdateMailTemplateInput
  ): Promise<MailTemplateWithUrlAndStatusModel> {
    const provider = this.mailContext.mailProvider;
    if (!provider.getCapabilities().canUpdateTemplates) {
      throw new BadRequestException(
        'The active mail provider does not support updating templates.'
      );
    }
    const local = await this.prismaService.mailTemplate.findUnique({
      where: { id },
    });
    if (!local) {
      throw new NotFoundException(`Mail template ${id} not found`);
    }
    if (local.remoteMissing) {
      throw new BadRequestException(
        'This template is missing on the remote provider — re-create it before editing.'
      );
    }

    const remote = await provider.updateTemplate(local.externalMailTemplateId, {
      name: input.name ?? undefined,
      html: input.html ?? undefined,
      subject: input.subject ?? undefined,
    });

    const updated = await this.prismaService.mailTemplate.update({
      where: { id },
      data: {
        name: remote.name,
        description: input.description ?? local.description,
      },
    });
    return updated as unknown as MailTemplateWithUrlAndStatusModel;
  }

  @Permissions(CanDeleteMailTemplates)
  @Mutation(() => Boolean, { nullable: true })
  async deleteMailTemplate(@Args('id') id: string): Promise<boolean> {
    const provider = this.mailContext.mailProvider;
    if (!provider.getCapabilities().canDeleteTemplates) {
      throw new BadRequestException(
        'The active mail provider does not support deleting templates.'
      );
    }
    const local = await this.prismaService.mailTemplate.findUnique({
      where: { id },
    });
    if (!local) {
      throw new NotFoundException(`Mail template ${id} not found`);
    }

    if (!local.remoteMissing) {
      await provider.deleteTemplate(local.externalMailTemplateId);
    }
    await this.prismaService.mailTemplate.delete({ where: { id } });
    return true;
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
