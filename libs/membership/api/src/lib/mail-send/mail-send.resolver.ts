import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { PrismaClient } from '@prisma/client';
import { CurrentUser, UserSession } from '@wepublish/authentication/api';
import { Permissions } from '@wepublish/permissions/api';
import { CanGetMailLogs, CanSendMailTemplates } from '@wepublish/permissions';
import {
  MailAudienceInput,
  MailLogFilter,
  MailSendJobInput,
  MailSendJobModel,
  MailSendRecipientPreview,
  PaginatedMailLog,
  PaginatedMailSendJob,
} from './mail-send.model';
import { MailSendJobService } from './mail-send-job.service';
import { MailSendRecipientService } from './mail-send-recipient.service';

@Resolver()
export class MailSendResolver {
  constructor(
    private prisma: PrismaClient,
    private mailSendJobService: MailSendJobService,
    private recipientService: MailSendRecipientService
  ) {}

  @Permissions(CanSendMailTemplates)
  @Query(() => MailSendRecipientPreview, {
    description: `Preview how many recipients an audience resolves to`,
  })
  async mailSendRecipientPreview(
    @Args('audience') audience: MailAudienceInput
  ): Promise<MailSendRecipientPreview> {
    const [count, allowsSubscriptionTemplates] = await Promise.all([
      this.recipientService.count(audience),
      Promise.resolve(
        this.recipientService.allowsSubscriptionTemplates(audience)
      ),
    ]);

    return { count, allowsSubscriptionTemplates };
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
      include: { mailTemplate: true },
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
        include: { mailTemplate: true },
        skip,
        take: boundedTake + 1,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return this.paginate(jobs, totalCount, skip, boundedTake);
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
        include: { recipient: true, mailTemplate: true },
        skip,
        take: boundedTake + 1,
        orderBy: { sentDate: 'desc' },
      }),
    ]);

    return this.paginate(logs, totalCount, skip, boundedTake);
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
