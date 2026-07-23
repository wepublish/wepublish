import { PrismaClient } from '@prisma/client';
import { UserSession } from '@wepublish/authentication/api';
import { MailSendResolver } from './mail-send.resolver';
import { MailSendJobService } from './mail-send-job.service';
import { MailSendRecipientService } from './mail-send-recipient.service';
import { MailRecipientBase } from './mail-send.model';

const session = { user: { id: 'editor-1' } } as UserSession;

const makeResolver = (
  prisma: any,
  jobService: any = {},
  recipientService: any = {}
) =>
  new MailSendResolver(
    prisma as PrismaClient,
    jobService as MailSendJobService,
    recipientService as MailSendRecipientService
  );

describe('MailSendResolver', () => {
  it('mailSendRecipientPreview returns count and template-eligibility', async () => {
    const recipientService = {
      count: jest.fn(async () => 12),
      allowsSubscriptionTemplates: jest.fn(() => true),
    };

    const preview = await makeResolver(
      {},
      {},
      recipientService
    ).mailSendRecipientPreview({ base: MailRecipientBase.hasSubscription });

    expect(preview).toEqual({ count: 12, allowsSubscriptionTemplates: true });
  });

  it('sendMailTemplateToUser delegates and attaches the template', async () => {
    const jobService = {
      sendToUser: jest.fn(async () => ({
        id: 'job-1',
        mailTemplateId: 'tpl-1',
      })),
    };
    const prisma = {
      mailTemplate: {
        findUnique: jest.fn(async () => ({ id: 'tpl-1', name: 'Welcome' })),
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
      createJob: jest.fn(async () => ({
        id: 'job-1',
        mailTemplateId: 'tpl-1',
      })),
    };
    const prisma = {
      mailTemplate: {
        findUnique: jest.fn(async () => ({ id: 'tpl-1', name: 'N' })),
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
          count: jest.fn(async () => 3),
          findMany: jest.fn(async () => rows),
        },
      };

      const result = await makeResolver(prisma).mailLogs(
        { mailTemplateId: 'tpl-1', recipientId: 'u1' } as any,
        0,
        2
      );

      const where = (prisma.mailLog.findMany as jest.Mock).mock.calls[0][0]
        .where;
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

  describe('mailSendJobs', () => {
    it('paginates jobs newest first', async () => {
      const prisma = {
        mailSendJob: {
          count: jest.fn(async () => 1),
          findMany: jest.fn(async () => [{ id: 'j1' }]),
        },
      };

      const result = await makeResolver(prisma).mailSendJobs(0, 20);

      expect(
        (prisma.mailSendJob.findMany as jest.Mock).mock.calls[0][0].orderBy
      ).toEqual({
        createdAt: 'desc',
      });
      expect(result.nodes).toHaveLength(1);
      expect(result.pageInfo.hasNextPage).toBe(false);
    });
  });
});
