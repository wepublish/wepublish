import { MailChannel, PrismaClient } from '@prisma/client';
import { UserSession } from '@wepublish/authentication/api';
import { MailSendResolver } from './mail-send.resolver';
import { MailSendJobService } from './mail-send-job.service';
import { MailSendRecipientService } from './mail-send-recipient.service';
import { MailLogSyncService } from './mail-log-sync.service';
import { EmailQualityService } from '../email-quality/email-quality.service';
import { EmailEvidenceService } from './email-evidence.service';
import { SuppressionSyncService } from './suppression-sync.service';
import { MailEmailSegment, MailRecipientBase } from './mail-send.model';
import type { Mock } from 'vitest';

const session = { user: { id: 'editor-1' } } as UserSession;

const makeResolver = (
  prisma: any,
  jobService: any = {},
  recipientService: any = {},
  mailLogSyncService: any = {},
  emailQualityService: any = {},
  emailEvidenceService: any = {},
  suppressionSyncService: any = {
    syncSuppressions: async () => ({ listed: 0, recorded: 0 }),
  }
) =>
  new MailSendResolver(
    prisma as PrismaClient,
    jobService as MailSendJobService,
    recipientService as MailSendRecipientService,
    mailLogSyncService as MailLogSyncService,
    emailQualityService as EmailQualityService,
    emailEvidenceService as EmailEvidenceService,
    suppressionSyncService as SuppressionSyncService
  );

describe('MailSendResolver', () => {
  it('emailEvidence hands out the evidence summary', async () => {
    const summary = { providerType: null, sources: [] };
    const resolver = makeResolver(
      {},
      {},
      {},
      {},
      {},
      {
        summary: vi.fn(async () => summary),
      }
    );

    await expect(resolver.emailEvidence()).resolves.toBe(summary);
  });

  // The GraphQL types for these relations are trimmed (`MailLogTemplate` exposes
  // only id+name, `MailLogRecipient` only id/email/name/firstName), so
  // `include: true` fetched whole rows — every template body, and the user's
  // password hash — for fields that can never be returned.
  describe('relation field selection', () => {
    const templateSelect = { select: { id: true, name: true } };

    it('mailLogs fetches only the exposed template and recipient fields', async () => {
      const prisma = {
        mailLog: {
          count: vi.fn(async () => 0),
          findMany: vi.fn(async () => []),
        },
      };

      await makeResolver(prisma).mailLogs(undefined, 0, 20);

      const args = (prisma.mailLog.findMany as Mock).mock.calls[0][0];

      expect(args.include).toEqual({
        mailTemplate: templateSelect,
        recipient: {
          select: { id: true, email: true, name: true, firstName: true },
        },
      });
    });

    it('mailSendJobs fetches only the exposed template fields', async () => {
      const prisma = {
        mailSendJob: {
          count: vi.fn(async () => 0),
          findMany: vi.fn(async () => []),
        },
      };

      await makeResolver(prisma).mailSendJobs(0, 20);

      const args = (prisma.mailSendJob.findMany as Mock).mock.calls[0][0];

      expect(args.include).toEqual({ mailTemplate: templateSelect });
    });

    it('mailSendJob fetches only the exposed template fields', async () => {
      const prisma = {
        mailSendJob: {
          findUnique: vi.fn(async () => null),
        },
      };

      await makeResolver(prisma).mailSendJob('job-1');

      const args = (prisma.mailSendJob.findUnique as Mock).mock.calls[0][0];

      expect(args.include).toEqual({ mailTemplate: templateSelect });
    });
  });

  it('mailSendRecipientPreview returns both counts and template-eligibility', async () => {
    // Twelve mails, ten people: two of them match through a second subscription.
    const segments = [
      { segment: MailEmailSegment.placeholder, userCount: 4 },
      { segment: MailEmailSegment.dead, userCount: 1 },
      { segment: MailEmailSegment.unresponsive, userCount: 0 },
      { segment: MailEmailSegment.unknown, userCount: 3 },
      { segment: MailEmailSegment.active, userCount: 2 },
    ];
    const recipientService = {
      count: vi.fn(async () => 12),
      countUsers: vi.fn(async () => 10),
      countWithoutAddress: vi.fn(async () => 3),
      countUsersBySegment: vi.fn(async () => segments),
      allowsSubscriptionTemplates: vi.fn(() => true),
    };

    const preview = await makeResolver(
      {},
      {},
      recipientService
    ).mailSendRecipientPreview({ base: MailRecipientBase.hasSubscription });

    expect(preview).toEqual({
      count: 12,
      userCount: 10,
      withoutAddressCount: 3,
      allowsSubscriptionTemplates: true,
      segments,
    });
  });

  it('mailSendRecipients lists through the preview order', async () => {
    // The preview puts the people a letter would skip first; the plain page
    // is the send order and must stay untouched.
    const recipientService = {
      count: vi.fn(async () => 1),
      resolvePage: vi.fn(),
      placeholderPatterns: vi.fn(async () => ['@placeholder.neuewege.ch']),
      resolvePreviewPage: vi.fn(async () => [
        {
          user: {
            id: 'u1',
            email: 'a@b.ch',
            name: 'A',
            address: null,
            emailQuality: { level: 'dead' },
          },
        },
        {
          user: {
            id: 'u2',
            email: 'nw-2@placeholder.neuewege.ch',
            name: 'B',
            address: null,
            emailQuality: null,
          },
        },
      ]),
    };

    const result = await makeResolver(
      {},
      {},
      recipientService
    ).mailSendRecipients(
      { base: MailRecipientBase.allUsers },
      0,
      50,
      MailChannel.letter
    );

    expect(recipientService.resolvePreviewPage).toHaveBeenCalledWith(
      { base: MailRecipientBase.allUsers },
      0,
      51,
      MailChannel.letter
    );
    expect(recipientService.resolvePage).not.toHaveBeenCalled();
    expect(result.nodes[0]).toMatchObject({
      userId: 'u1',
      hasAddress: false,
      emailSegment: MailEmailSegment.dead,
    });
    expect(result.nodes[1]).toMatchObject({
      emailSegment: MailEmailSegment.placeholder,
    });
  });

  it('sendMailTemplateToUser delegates and attaches the template', async () => {
    const jobService = {
      sendToUser: vi.fn(async () => ({
        id: 'job-1',
        mailTemplateId: 'tpl-1',
      })),
    };
    const prisma = {
      mailTemplate: {
        findUnique: vi.fn(async () => ({ id: 'tpl-1', name: 'Welcome' })),
      },
    };

    const result = await makeResolver(
      prisma,
      jobService
    ).sendMailTemplateToUser(session, 'tpl-1', 'u1');

    expect(jobService.sendToUser).toHaveBeenCalledWith(
      'tpl-1',
      'u1',
      'editor-1'
    );
    expect(result.mailTemplate).toEqual({ id: 'tpl-1', name: 'Welcome' });
  });

  it('createMailSendJob delegates to the service with the current user', async () => {
    const jobService = {
      createJob: vi.fn(async () => ({
        id: 'job-1',
        mailTemplateId: 'tpl-1',
      })),
    };
    const prisma = {
      mailTemplate: {
        findUnique: vi.fn(async () => ({ id: 'tpl-1', name: 'N' })),
      },
    };
    const input = {
      mailTemplateId: 'tpl-1',
      audience: { base: MailRecipientBase.allUsers },
    };

    await makeResolver(prisma, jobService).createMailSendJob(session, input);

    expect(jobService.createJob).toHaveBeenCalledWith(input, 'editor-1');
  });

  describe('mailLogs', () => {
    it('builds the where clause from the filter and paginates', async () => {
      const rows = [
        { id: 'l1' },
        { id: 'l2' },
        { id: 'l3' }, // extra row signalling a next page (take = 2)
      ];
      const prisma = {
        mailLog: {
          count: vi.fn(async () => 3),
          findMany: vi.fn(async () => rows),
        },
      };

      const result = await makeResolver(prisma).mailLogs(
        { mailTemplateId: 'tpl-1', recipientId: 'u1' } as any,
        0,
        2
      );

      const where = (prisma.mailLog.findMany as Mock).mock.calls[0][0].where;
      expect(where).toMatchObject({
        mailTemplateId: 'tpl-1',
        recipientID: 'u1',
      });
      expect(result.nodes).toHaveLength(2);
      expect(result.totalCount).toBe(3);
      expect(result.pageInfo.hasNextPage).toBe(true);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
    });
  });

  // The feedback loop of a campaign: states a provider reported late, then
  // the levels. Manual, because the media decide when to look.
  it('refreshEmailQuality polls the provider and then re-evaluates', async () => {
    const order: string[] = [];
    const mailLogSyncService = {
      syncOpenStates: vi.fn(async () => {
        order.push('sync');

        return { checked: 5, updated: 2 };
      }),
    };
    const emailQualityService = {
      recomputeAll: vi.fn(async () => {
        order.push('recompute');

        return { recomputed: 7 };
      }),
    };
    const suppressionSyncService = {
      syncSuppressions: vi.fn(async () => {
        order.push('suppressions');

        return { listed: 0, recorded: 0 };
      }),
    };

    await expect(
      makeResolver(
        {},
        {},
        {},
        mailLogSyncService,
        emailQualityService,
        {},
        suppressionSyncService
      ).refreshEmailQuality()
    ).resolves.toEqual({ checked: 5, updated: 2, recomputed: 7 });

    expect(order).toEqual(['sync', 'suppressions', 'recompute']);
  });

  it('refreshEmailQuality still re-evaluates when the suppression lists cannot be read', async () => {
    const emailQualityService = {
      recomputeAll: vi.fn(async () => ({ recomputed: 1 })),
    };

    await expect(
      makeResolver(
        {},
        {},
        {},
        { syncOpenStates: async () => ({ checked: 0, updated: 0 }) },
        emailQualityService,
        {},
        {
          syncSuppressions: vi.fn().mockRejectedValue(new Error('Invalid_Key')),
        }
      ).refreshEmailQuality()
    ).resolves.toEqual({ checked: 0, updated: 0, recomputed: 1 });
    expect(emailQualityService.recomputeAll).toHaveBeenCalled();
  });

  describe('mailSendJobs', () => {
    it('paginates jobs newest first', async () => {
      const prisma = {
        mailSendJob: {
          count: vi.fn(async () => 1),
          findMany: vi.fn(async () => [{ id: 'j1' }]),
        },
      };

      const result = await makeResolver(prisma).mailSendJobs(0, 20);

      expect(
        (prisma.mailSendJob.findMany as Mock).mock.calls[0][0].orderBy
      ).toEqual({
        createdAt: 'desc',
      });
      expect(result.nodes).toHaveLength(1);
      expect(result.pageInfo.hasNextPage).toBe(false);
    });
  });
});
