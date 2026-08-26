import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { MailSendJobRecipientState, PrismaClient } from '@prisma/client';
import { CurrentUser, UserSession } from '@wepublish/authentication/api';
import { Permissions } from '@wepublish/permissions/api';
import { CanGetMailLogs, CanSendMailTemplates } from '@wepublish/permissions';
import {
  MailAudienceInput,
  MailLogFilter,
  MailLogSyncModel,
  MailSendJobInput,
  MailSendJobModel,
  MailSendPreviewInput,
  MailSendPreviewModel,
  MailSendRecipientPreview,
  PaginatedMailLog,
  PaginatedMailSendJob,
  PaginatedMailSendJobRecipient,
  PaginatedMailSendRecipient,
} from './mail-send.model';
import { MailSendJobService } from './mail-send-job.service';
import { MailSendRecipientService } from './mail-send-recipient.service';
import { MailLogSyncService } from './mail-log-sync.service';

/**
 * `MailLogTemplate` and `MailLogRecipient` expose only these fields, so there is
 * nothing to gain from loading the rest of the row — and plenty to lose:
 * templates carry their full html/text body, users their password hash.
 */
const mailLogTemplateSelect = { select: { id: true, name: true } } as const;

const mailLogRecipientSelect = {
  select: { id: true, email: true, name: true, firstName: true },
} as const;

@Resolver()
export class MailSendResolver {
  constructor(
    private prisma: PrismaClient,
    private mailSendJobService: MailSendJobService,
    private recipientService: MailSendRecipientService,
    private mailLogSyncService: MailLogSyncService
  ) {}

  @Permissions(CanSendMailTemplates)
  @Query(() => MailSendRecipientPreview, {
    description: `Preview how many recipients an audience resolves to`,
  })
  async mailSendRecipientPreview(
    @Args('audience') audience: MailAudienceInput
  ): Promise<MailSendRecipientPreview> {
    const [count, userCount] = await Promise.all([
      this.recipientService.count(audience),
      this.recipientService.countUsers(audience),
    ]);

    return {
      count,
      userCount,
      allowsSubscriptionTemplates:
        this.recipientService.allowsSubscriptionTemplates(audience),
    };
  }

  @Permissions(CanSendMailTemplates)
  @Query(() => PaginatedMailSendRecipient, {
    description: `The concrete recipients an audience resolves to`,
  })
  async mailSendRecipients(
    @Args('audience') audience: MailAudienceInput,
    @Args('skip', { type: () => Int, nullable: true }) skip = 0,
    @Args('take', { type: () => Int, nullable: true }) take = 50
  ): Promise<PaginatedMailSendRecipient> {
    const boundedTake = Math.min(take, 100);

    const [totalCount, recipients] = await Promise.all([
      this.recipientService.count(audience),
      this.recipientService.resolvePage(audience, skip, boundedTake + 1),
    ]);

    const rows = recipients.map(({ user, subscription }) => ({
      // A user can match more than once (one row per subscription).
      id: `${user.id}:${subscription?.id ?? ''}`,
      userId: user.id,
      email: user.email,
      name: user.name,
      firstName: user.firstName,
      subscriptionId: subscription?.id ?? null,
      memberPlanName:
        (subscription?.memberPlan as { name?: string } | undefined)?.name ??
        null,
    }));

    return this.paginate(rows, totalCount, skip, boundedTake);
  }

  @Permissions(CanSendMailTemplates)
  @Query(() => [String], {
    description: `Placeholders a template uses that would render empty for the given send (empty = none missing)`,
  })
  async mailTemplateMissingPlaceholders(
    @Args('templateId') templateId: string,
    @Args('withSubscriptionData', { type: () => Boolean })
    withSubscriptionData: boolean
  ): Promise<string[]> {
    return this.mailSendJobService.missingPlaceholders(
      templateId,
      withSubscriptionData
    );
  }

  @Permissions(CanSendMailTemplates)
  @Query(() => MailSendPreviewModel, {
    description: `Render a saved template for one recipient of an audience, exactly as the send would compose it`,
  })
  async mailSendPreview(
    @Args('input') input: MailSendPreviewInput
  ): Promise<MailSendPreviewModel> {
    const result = await this.mailSendJobService.previewForAudience(input);

    return {
      subject: result.subject,
      html: result.html,
      text: result.text,
      recipient:
        result.recipient ?
          {
            id: `${result.recipient.user.id}:${
              result.recipient.subscription?.id ?? ''
            }`,
            userId: result.recipient.user.id,
            email: result.recipient.user.email,
            name: result.recipient.user.name,
            firstName: result.recipient.user.firstName,
            subscriptionId: result.recipient.subscription?.id ?? null,
            memberPlanName:
              (
                result.recipient.subscription?.memberPlan as
                  | { name?: string }
                  | undefined
              )?.name ?? null,
          }
        : null,
    };
  }

  @Permissions(CanSendMailTemplates)
  @Mutation(() => MailSendJobModel, {
    description: `Manually send a mail template to a single user`,
  })
  async sendMailTemplateToUser(
    @CurrentUser() user: UserSession,
    @Args('templateId') templateId: string,
    @Args('userId') userId: string
  ): Promise<MailSendJobModel> {
    return this.withTemplate(
      this.mailSendJobService.sendToUser(templateId, userId, user.user.id)
    );
  }

  @Permissions(CanSendMailTemplates)
  @Mutation(() => MailSendJobModel, {
    description: `Start a background job sending a template to a filtered audience`,
  })
  async createMailSendJob(
    @CurrentUser() user: UserSession,
    @Args('input') input: MailSendJobInput
  ): Promise<MailSendJobModel> {
    return this.withTemplate(
      this.mailSendJobService.createJob(input, user.user.id)
    );
  }

  @Permissions(CanGetMailLogs)
  @Query(() => MailSendJobModel, {
    nullable: true,
    description: `A single mail send job (for progress polling)`,
  })
  async mailSendJob(@Args('id') id: string) {
    return this.prisma.mailSendJob.findUnique({
      where: { id },
      include: { mailTemplate: mailLogTemplateSelect },
    });
  }

  @Permissions(CanGetMailLogs)
  @Query(() => PaginatedMailSendJob, {
    description: `Paginated list of mail send jobs`,
  })
  async mailSendJobs(
    @Args('skip', { type: () => Int, nullable: true }) skip = 0,
    @Args('take', { type: () => Int, nullable: true }) take = 20
  ): Promise<PaginatedMailSendJob> {
    const boundedTake = Math.min(take, 100);

    const [totalCount, jobs] = await Promise.all([
      this.prisma.mailSendJob.count(),
      this.prisma.mailSendJob.findMany({
        include: { mailTemplate: mailLogTemplateSelect },
        skip,
        take: boundedTake + 1,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return this.paginate(jobs, totalCount, skip, boundedTake);
  }

  @Permissions(CanGetMailLogs)
  @Query(() => PaginatedMailSendJobRecipient, {
    description: `The planned mails of a send job and where each of them stands`,
  })
  async mailSendJobRecipients(
    @Args('jobId') jobId: string,
    @Args('state', {
      type: () => MailSendJobRecipientState,
      nullable: true,
    })
    state: MailSendJobRecipientState | undefined,
    @Args('skip', { type: () => Int, nullable: true }) skip = 0,
    @Args('take', { type: () => Int, nullable: true }) take = 50
  ): Promise<PaginatedMailSendJobRecipient> {
    const boundedTake = Math.min(take, 100);
    // An absent state means every state — `state: null` would match nothing.
    const where = { jobId, ...(state ? { state } : {}) };

    const [totalCount, entries] = await Promise.all([
      this.prisma.mailSendJobRecipient.count({ where }),
      this.prisma.mailSendJobRecipient.findMany({
        where,
        include: {
          user: true,
          subscription: { include: { memberPlan: true } },
        },
        skip,
        take: boundedTake + 1,
        orderBy: { position: 'asc' },
      }),
    ]);

    const rows = entries.map(entry => ({
      id: entry.id,
      position: entry.position,
      state: entry.state,
      attempts: entry.attempts,
      error: entry.error,
      sentAt: entry.sentAt,
      mailLogId: entry.mailLogId,
      user: entry.user,
      memberPlanName: entry.subscription?.memberPlan?.name ?? null,
    }));

    return this.paginate(rows, totalCount, skip, boundedTake);
  }

  @Permissions(CanSendMailTemplates)
  @Mutation(() => MailSendJobModel, {
    description: `Continue a send job that stopped early. Recipients already sent are skipped.`,
  })
  async resumeMailSendJob(
    @Args('id') id: string,
    @Args('retryUnfinished', { type: () => Boolean, nullable: true })
    retryUnfinished = false
  ): Promise<MailSendJobModel> {
    return this.withTemplate(
      this.mailSendJobService.resumeJob(id, retryUnfinished)
    );
  }

  @Permissions(CanSendMailTemplates)
  @Mutation(() => MailSendJobModel, {
    description: `Stop a running send job. Unsent recipients stay open and can be continued.`,
  })
  async cancelMailSendJob(@Args('id') id: string): Promise<MailSendJobModel> {
    return this.withTemplate(this.mailSendJobService.cancelJob(id));
  }

  @Permissions(CanGetMailLogs)
  @Query(() => PaginatedMailLog, {
    description: `Paginated list of sent mails`,
  })
  async mailLogs(
    @Args('filter', { type: () => MailLogFilter, nullable: true })
    filter: MailLogFilter | undefined,
    @Args('skip', { type: () => Int, nullable: true }) skip = 0,
    @Args('take', { type: () => Int, nullable: true }) take = 20
  ): Promise<PaginatedMailLog> {
    const boundedTake = Math.min(take, 100);
    const where = {
      mailTemplateId: filter?.mailTemplateId,
      recipientID: filter?.recipientId,
      state: filter?.state,
      type: filter?.type,
      mailSendJobId: filter?.mailSendJobId,
    };

    const [totalCount, logs] = await Promise.all([
      this.prisma.mailLog.count({ where }),
      this.prisma.mailLog.findMany({
        where,
        include: {
          mailTemplate: mailLogTemplateSelect,
          recipient: mailLogRecipientSelect,
        },
        skip,
        take: boundedTake + 1,
        orderBy: { sentDate: 'desc' },
      }),
    ]);

    return this.paginate(logs, totalCount, skip, boundedTake);
  }

  @Permissions(CanGetMailLogs)
  @Mutation(() => MailLogSyncModel, {
    description: `Ask the mail provider for the current delivery state of mails that are still open. Complements the provider webhook, which is not reachable in local development.`,
  })
  async syncMailLogStates(
    @Args('limit', { type: () => Int, nullable: true }) limit?: number
  ): Promise<MailLogSyncModel> {
    return this.mailLogSyncService.syncOpenStates(limit ?? undefined);
  }

  private paginate<T extends { id: string }>(
    rows: T[],
    totalCount: number,
    skip: number,
    take: number
  ) {
    const nodes = rows.slice(0, take);

    return {
      nodes,
      totalCount,
      pageInfo: {
        hasPreviousPage: Boolean(skip),
        hasNextPage: rows.length > nodes.length,
        startCursor: nodes[0]?.id,
        endCursor: nodes[nodes.length - 1]?.id,
      },
    };
  }

  private async withTemplate<T extends { mailTemplateId: string }>(
    jobPromise: Promise<T>
  ) {
    const job = await jobPromise;
    const mailTemplate = await this.prisma.mailTemplate.findUnique({
      where: { id: job.mailTemplateId },
      select: { id: true, name: true },
    });

    return { ...job, mailTemplate };
  }
}
