import {
  Args,
  Int,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { MailContext, MailTemplateStatus } from '@wepublish/mail/api';
import {
  CanCreateMailTemplates,
  CanDeleteMailTemplates,
  CanGetMailTemplates,
  CanSendTestMailTemplates,
  CanUpdateMailTemplates,
} from '@wepublish/permissions';
import {
  MailProviderModel,
  MailTemplateInput,
  MailTemplateModel,
  MailTemplatePreviewInput,
  MailTemplatePreviewModel,
  MailTemplateSubscriptionOption,
  SendTestMailTemplateInput,
} from './mail-template.model';
import { PrismaClient } from '@prisma/client';
import { CurrentUser, UserSession } from '@wepublish/authentication/api';
import { Permissions } from '@wepublish/permissions/api';
import { MailTemplateService } from './mail-template.service';
import { MailTemplateContextId } from './mail-template-data';

@Resolver(() => MailTemplateModel)
export class MailTemplatesResolver {
  constructor(
    private prismaService: PrismaClient,
    private mailContext: MailContext,
    private mailTemplateService: MailTemplateService
  ) {}

  @Permissions(CanGetMailTemplates)
  @Query(() => [MailTemplateModel], {
    description: `Return all mail templates`,
  })
  async mailTemplates() {
    return this.prismaService.mailTemplate.findMany({
      orderBy: [{ name: 'asc' }],
    });
  }

  @Permissions(CanGetMailTemplates)
  @Query(() => MailProviderModel)
  async provider() {
    const provider = await this.mailContext.mailProvider;
    return { name: provider.getName() };
  }

  @Permissions(CanGetMailTemplates)
  @Query(() => [MailTemplateSubscriptionOption], {
    description: `Search subscriptions to use as sample data for previews/tests`,
  })
  async mailTemplateSubscriptions(
    @Args('query', { nullable: true }) query?: string
  ): Promise<MailTemplateSubscriptionOption[]> {
    const subscriptions = await this.prismaService.subscription.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      where:
        query ?
          {
            user: {
              OR: [
                { email: { contains: query, mode: 'insensitive' } },
                { name: { contains: query, mode: 'insensitive' } },
                { firstName: { contains: query, mode: 'insensitive' } },
              ],
            },
          }
        : undefined,
      include: { user: true, memberPlan: true },
    });

    return subscriptions.map(subscription => ({
      id: subscription.id,
      label: `${subscription.user?.email ?? 'unknown'} — ${
        subscription.memberPlan?.name ?? 'plan'
      } (${subscription.paymentPeriodicity})`,
    }));
  }

  @Permissions(CanGetMailTemplates)
  @Query(() => MailTemplatePreviewModel, {
    description: `Render a draft mail template with a mail type's sample data`,
  })
  async mailTemplatePreview(
    @CurrentUser() user: UserSession,
    @Args('input') input: MailTemplatePreviewInput
  ): Promise<MailTemplatePreviewModel> {
    const result = await this.mailTemplateService.preview({
      contextId: input.contextId as MailTemplateContextId,
      subscriptionId: input.subscriptionId,
      currentUserId: user.user.id,
      subject: input.subject,
      html: input.htmlContent,
      text: input.textContent,
    });

    return { subject: result.subject, html: result.html, text: result.text };
  }

  @Permissions(CanCreateMailTemplates)
  @Mutation(() => MailTemplateModel, {
    description: `Create a new mail template`,
  })
  async createMailTemplate(@Args('input') input: MailTemplateInput) {
    return this.prismaService.mailTemplate.create({
      data: input,
    });
  }

  @Permissions(CanUpdateMailTemplates)
  @Mutation(() => MailTemplateModel, {
    description: `Update an existing mail template`,
  })
  async updateMailTemplate(
    @Args('id') id: string,
    @Args('input') input: MailTemplateInput
  ) {
    return this.prismaService.mailTemplate.update({
      where: { id },
      data: input,
    });
  }

  @Permissions(CanDeleteMailTemplates)
  @Mutation(() => Boolean, {
    nullable: true,
    description: `Delete an existing mail template`,
  })
  async deleteMailTemplate(@Args('id') id: string) {
    await this.mailTemplateService.deleteMailTemplate(id);
  }

  @Permissions(CanUpdateMailTemplates)
  @Mutation(() => Int, {
    description: `Import HTML/subject from the mail provider, overwriting local content`,
  })
  async importMailTemplatesFromProvider(): Promise<number> {
    return this.mailTemplateService.importFromProvider();
  }

  @Permissions(CanSendTestMailTemplates)
  @Mutation(() => Boolean, {
    nullable: true,
    description: `Send a test mail for a draft template`,
  })
  async sendTestMailTemplate(
    @CurrentUser() user: UserSession,
    @Args('input') input: SendTestMailTemplateInput
  ) {
    // Test mails always go to the current editor only — never an arbitrary
    // address — and carry that user's own login token.
    await this.mailTemplateService.sendTest({
      contextId: input.contextId as MailTemplateContextId,
      subscriptionId: input.subscriptionId,
      currentUserId: user.user.id,
      recipient: user.user.email,
      subject: input.subject,
      html: input.htmlContent,
      text: input.textContent,
    });
  }

  @ResolveField('status', () => MailTemplateStatus, {
    description: 'Status of the template',
  })
  async status(
    @Parent() template: MailTemplateModel
  ): Promise<MailTemplateStatus> {
    const usedTemplates = await this.mailContext.getUsedTemplateIdentifiers();

    if (!usedTemplates.includes(template.id)) {
      return MailTemplateStatus.Unused;
    }

    return MailTemplateStatus.Ok;
  }
}
