import {
  Args,
  Int,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import {
  attachmentIdsOf,
  MAIL_TEMPLATE_ATTACHMENT_IDS,
  MailContext,
  MailTemplateStatus,
} from '@wepublish/mail/api';
import {
  CanCreateMailTemplates,
  CanDeleteMailTemplates,
  CanGetMailTemplates,
  CanSendMailTemplates,
  CanSendTestMailTemplates,
  CanUpdateMailTemplates,
} from '@wepublish/permissions';
import {
  ATTACHMENT_IDS_DESCRIPTION,
  MailProviderModel,
  MailTemplateInput,
  MailTemplateLetterPreviewModel,
  MailTemplateModel,
  MailTemplatePreviewInput,
  MailTemplatePreviewModel,
  MailTemplateSubscriptionOption,
  MailTemplateVariantModel,
  SendTestMailTemplateInput,
} from './mail-template.model';
import { MailChannel, MailTemplateVariant, PrismaClient } from '@prisma/client';
import {
  actorOf,
  AuthSession,
  CurrentUser,
  requireSessionUser,
} from '@wepublish/authentication/api';
import { Feature } from '@wepublish/features/api';
import { Permissions } from '@wepublish/permissions/api';
import { MailTemplateService } from './mail-template.service';
import { UsedMailTemplateDataloader } from './used-mail-template.dataloader';
import {
  MailTemplateVariantDataloader,
  MailTemplateVariantSummaryDataloader,
} from './mail-template-variant.dataloader';
import { MailTemplateContextId } from './mail-template-data';

@Resolver(() => MailTemplateModel)
export class MailTemplatesResolver {
  constructor(
    private prismaService: PrismaClient,
    private mailContext: MailContext,
    private mailTemplateService: MailTemplateService,
    private usedMailTemplateDataloader: UsedMailTemplateDataloader,
    private variantDataloader: MailTemplateVariantDataloader,
    private variantSummaryDataloader: MailTemplateVariantSummaryDataloader
  ) {}

  @Permissions(CanGetMailTemplates)
  @Query(() => [MailTemplateModel], {
    description: `Return all mail templates`,
  })
  async mailTemplates() {
    return this.prismaService.mailTemplate.findMany({
      orderBy: [{ name: 'asc' }],
      include: MAIL_TEMPLATE_ATTACHMENT_IDS,
    });
  }

  @Permissions(CanGetMailTemplates)
  @Query(() => MailTemplateModel, {
    nullable: true,
    description: `Return a single mail template; its \`variants\` carry the html and text bodies.`,
  })
  async mailTemplate(@Args('id') id: string) {
    return this.prismaService.mailTemplate.findUnique({
      where: { id },
      include: MAIL_TEMPLATE_ATTACHMENT_IDS,
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
    @CurrentUser() session: AuthSession,
    @Args('input') input: MailTemplatePreviewInput
  ): Promise<MailTemplatePreviewModel> {
    const result = await this.mailTemplateService.preview({
      contextId: input.contextId as MailTemplateContextId,
      subscriptionId: input.subscriptionId,
      currentUserId: actorOf(session).userId,
      subject: input.subject,
      html: input.htmlContent,
      text: input.textContent,
    });

    return { subject: result.subject, html: result.html, text: result.text };
  }

  // Asked by both the template editor and the send page, so either permission
  // is enough.
  @Feature('paper-letters')
  @Permissions(CanGetMailTemplates, CanSendMailTemplates)
  @Query(() => Boolean, {
    description: `Whether a letter integration is configured, so letters can be previewed and sent`,
  })
  letterChannelAvailable(): Promise<boolean> {
    return this.mailTemplateService.isLetterChannelAvailable();
  }

  @Feature('paper-letters')
  @Permissions(CanGetMailTemplates)
  @Query(() => MailTemplateLetterPreviewModel, {
    description: `Render a draft mail template as the letter a send would print`,
  })
  async mailTemplateLetterPreview(
    @CurrentUser() session: AuthSession,
    @Args('input') input: MailTemplatePreviewInput
  ): Promise<MailTemplateLetterPreviewModel> {
    return this.mailTemplateService.previewLetter({
      contextId: input.contextId as MailTemplateContextId,
      subscriptionId: input.subscriptionId,
      currentUserId: actorOf(session).userId,
      html: input.htmlContent,
      letterLayoutId: input.letterLayoutId,
      letterAppendixId: input.letterAppendixId,
      attachmentIds: input.attachmentIds,
    });
  }

  @Permissions(CanCreateMailTemplates)
  @Mutation(() => MailTemplateModel, {
    description: `Create a new mail template`,
  })
  async createMailTemplate(@Args('input') input: MailTemplateInput) {
    return this.mailTemplateService.createMailTemplate(input);
  }

  @Permissions(CanUpdateMailTemplates)
  @Mutation(() => MailTemplateModel, {
    description: `Update an existing mail template`,
  })
  async updateMailTemplate(
    @Args('id') id: string,
    @Args('input') input: MailTemplateInput
  ) {
    return this.mailTemplateService.updateMailTemplate(id, input);
  }

  @Permissions(CanUpdateMailTemplates)
  @Mutation(() => Boolean, {
    nullable: true,
    description: `Remove what a template says on one channel. Refused while something still sends the template on that channel, and for its last version.`,
  })
  async deleteMailTemplateVariant(
    @Args('templateId') templateId: string,
    @Args('channel', { type: () => MailChannel }) channel: MailChannel
  ) {
    await this.mailTemplateService.deleteMailTemplateVariant(
      templateId,
      channel
    );
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
    @CurrentUser() session: AuthSession,
    @Args('input') input: SendTestMailTemplateInput
  ) {
    const user = requireSessionUser(session);

    // Test mails always go to the current editor only — never an arbitrary
    // address — and carry that user's own login token.
    await this.mailTemplateService.sendTest({
      contextId: input.contextId as MailTemplateContextId,
      subscriptionId: input.subscriptionId,
      currentUserId: user.id,
      recipient: user.email,
      subject: input.subject,
      html: input.htmlContent,
      text: input.textContent,
      attachmentIds: input.attachmentIds,
    });
  }

  @ResolveField('attachmentIds', () => [String], {
    description: ATTACHMENT_IDS_DESCRIPTION,
  })
  async attachmentIds(
    @Parent()
    template: MailTemplateModel & { attachments?: { documentId: string }[] }
  ): Promise<string[]> {
    // Every query here loads them along; this only covers a template that
    // reached the field some other way.
    if (template.attachments) {
      return attachmentIdsOf(template);
    }

    const loaded = await this.prismaService.mailTemplate.findUnique({
      where: { id: template.id },
      include: MAIL_TEMPLATE_ATTACHMENT_IDS,
    });

    return loaded ? attachmentIdsOf(loaded) : [];
  }

  @ResolveField('status', () => MailTemplateStatus, {
    description: 'Status of the template',
  })
  async status(
    @Parent() template: MailTemplateModel
  ): Promise<MailTemplateStatus> {
    // Batched: this field resolves once per template, so looking the usage up
    // per template would fan a single `mailTemplates` query out into one lookup
    // per row and exhaust the connection pool.
    const isUsed = await this.usedMailTemplateDataloader.load(template.id);

    return isUsed ? MailTemplateStatus.Ok : MailTemplateStatus.Unused;
  }

  @ResolveField('channels', () => [MailChannel], {
    description: 'The channels this template is written for, the email first.',
  })
  async channels(
    @Parent() template: MailTemplateModel
  ): Promise<MailChannel[]> {
    const variants = await this.variantSummaryDataloader.load(template.id);

    return (variants ?? []).map(({ channel }) => channel);
  }

  @ResolveField('subject', () => String, {
    description:
      'The subject of the email version; the title of the letter for a template written as a letter only.',
  })
  async subject(@Parent() template: MailTemplateModel): Promise<string> {
    const variants = await this.variantSummaryDataloader.load(template.id);

    return variants?.[0]?.subject ?? '';
  }

  @ResolveField('variants', () => [MailTemplateVariantModel], {
    description:
      'What the template says on each channel, bodies included. Ask for it on a single template, not on a list.',
  })
  async variants(
    @Parent() template: MailTemplateModel
  ): Promise<MailTemplateVariant[]> {
    return (await this.variantDataloader.load(template.id)) ?? [];
  }

  private async variantOf(
    template: MailTemplateModel,
    channel: MailChannel
  ): Promise<MailTemplateVariant | undefined> {
    return (await this.variants(template)).find(
      variant => variant.channel === channel
    );
  }

  @ResolveField('htmlContent', () => String, {
    deprecationReason: 'Use `variants`: a template has a body per channel.',
  })
  async htmlContent(@Parent() template: MailTemplateModel): Promise<string> {
    return (
      (await this.variantOf(template, MailChannel.mail))?.htmlContent ?? ''
    );
  }

  @ResolveField('textContent', () => String, {
    nullable: true,
    deprecationReason: 'Use `variants`: a template has a body per channel.',
  })
  async textContent(
    @Parent() template: MailTemplateModel
  ): Promise<string | null> {
    return (
      (await this.variantOf(template, MailChannel.mail))?.textContent ?? null
    );
  }

  @ResolveField('letterLayoutId', () => String, {
    nullable: true,
    deprecationReason: 'Use the letter entry of `variants`.',
  })
  async letterLayoutId(
    @Parent() template: MailTemplateModel
  ): Promise<string | null> {
    return (
      (await this.variantOf(template, MailChannel.letter))?.letterLayoutId ??
      null
    );
  }

  @ResolveField('letterAppendixId', () => String, {
    nullable: true,
    deprecationReason: 'Use the letter entry of `variants`.',
  })
  async letterAppendixId(
    @Parent() template: MailTemplateModel
  ): Promise<string | null> {
    return (
      (await this.variantOf(template, MailChannel.letter))?.letterAppendixId ??
      null
    );
  }
}
