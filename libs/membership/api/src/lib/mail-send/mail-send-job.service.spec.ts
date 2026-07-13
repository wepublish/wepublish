import { BadRequestException } from '@nestjs/common';
import { MailContext, mailLogType } from '@wepublish/mail/api';
import { PrismaClient } from '@prisma/client';
import { MailSendJobService } from './mail-send-job.service';
import { MailSendRecipientService } from './mail-send-recipient.service';
import { MailRecipientBase } from './mail-send.model';

const makeService = (
  prisma: any,
  mailContext: any = { sendMail: jest.fn() },
  recipientService: any = {}
) =>
  new MailSendJobService(
    prisma as PrismaClient,
    mailContext as unknown as MailContext,
    recipientService as MailSendRecipientService
  );

const template = (context: string | null) => ({
  id: 'tpl-1',
  name: 'Newsletter',
  context,
});

describe('MailSendJobService', () => {
  describe('sendToUser', () => {
    it('sends any template (no context restriction) with empty optional data', async () => {
      const created = { id: 'job-1', mailTemplateId: 'tpl-1' };
      const prisma = {
        mailTemplate: { findUnique: jest.fn(async () => template('renewal')) },
        user: {
          findUnique: jest.fn(async () => ({ id: 'u1', email: 'x@y.ch' })),
        },
        mailSendJob: {
          create: jest.fn(async () => created),
          update: jest.fn(async (args: any) => ({ ...created, ...args.data })),
        },
      };
      const mailContext = { sendMail: jest.fn(async () => undefined) };

      const result = await makeService(prisma, mailContext).sendToUser(
        'tpl-1',
        'u1',
        'editor-1'
      );

      expect(mailContext.sendMail).toHaveBeenCalledTimes(1);
      expect(
        (mailContext.sendMail as jest.Mock).mock.calls[0][0].optionalData
      ).toEqual({});
      expect(result.status).toBe('done');
    });

    it('rejects an unknown user', async () => {
      const prisma = {
        mailTemplate: { findUnique: jest.fn(async () => template('custom')) },
        user: { findUnique: jest.fn(async () => null) },
      };

      await expect(
        makeService(prisma).sendToUser('tpl-1', 'u1', 'editor-1')
      ).rejects.toThrow(BadRequestException);
    });

    it('sends the mail and marks the job done', async () => {
      const created = { id: 'job-1', mailTemplateId: 'tpl-1' };
      const prisma = {
        mailTemplate: { findUnique: jest.fn(async () => template('custom')) },
        user: {
          findUnique: jest.fn(async () => ({ id: 'u1', email: 'x@y.ch' })),
        },
        mailSendJob: {
          create: jest.fn(async () => created),
          update: jest.fn(async (args: any) => ({ ...created, ...args.data })),
        },
      };
      const mailContext = { sendMail: jest.fn(async () => undefined) };

      const result = await makeService(prisma, mailContext).sendToUser(
        'tpl-1',
        'u1',
        'editor-1'
      );

      expect(mailContext.sendMail).toHaveBeenCalledTimes(1);
      const sendArgs = (mailContext.sendMail as jest.Mock).mock.calls[0][0];
      expect(sendArgs).toMatchObject({
        mailTemplateId: 'tpl-1',
        mailType: mailLogType.Manual,
        mailSendJobId: 'job-1',
        optionalData: {},
      });
      expect(result.status).toBe('done');
      expect(prisma.mailSendJob.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ sentCount: 1, failedCount: 0 }),
        })
      );
    });

    it('marks the job failed when delivery throws', async () => {
      const created = { id: 'job-1', mailTemplateId: 'tpl-1' };
      const prisma = {
        mailTemplate: { findUnique: jest.fn(async () => template('custom')) },
        user: {
          findUnique: jest.fn(async () => ({ id: 'u1', email: 'x@y.ch' })),
        },
        mailSendJob: {
          create: jest.fn(async () => created),
          update: jest.fn(async (args: any) => ({ ...created, ...args.data })),
        },
      };
      const mailContext = {
        sendMail: jest.fn(async () => {
          throw new Error('smtp down');
        }),
      };

      const result = await makeService(prisma, mailContext).sendToUser(
        'tpl-1',
        'u1',
        'editor-1'
      );

      expect(result.status).toBe('failed');
      expect(prisma.mailSendJob.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ sentCount: 0, failedCount: 1 }),
        })
      );
    });
  });

  describe('createJob', () => {
    const drainSafePrisma = (extra: any) => ({
      mailSendJob: {
        create: jest.fn(async (args: any) => ({ id: 'job-1', ...args.data })),
        findMany: jest.fn(async () => []),
        updateMany: jest.fn(async () => ({ count: 0 })),
        ...extra,
      },
    });

    it('allows any template on any audience (warnings, not blocking)', async () => {
      const prisma = {
        mailTemplate: { findUnique: jest.fn(async () => template('renewal')) },
        ...drainSafePrisma({}),
      };
      const recipientService = {
        allowsSubscriptionTemplates: () => false,
        count: jest.fn(async () => 5),
      };

      const job = await makeService(
        prisma,
        undefined,
        recipientService
      ).createJob(
        {
          mailTemplateId: 'tpl-1',
          audience: { base: MailRecipientBase.allUsers },
        },
        'editor-1'
      );

      expect(job.status).toBe('queued');
      expect(job.totalCount).toBe(5);
    });

    it('creates a queued job with the recipient count and maps the audience', async () => {
      const prisma = {
        mailTemplate: { findUnique: jest.fn(async () => template('custom')) },
        ...drainSafePrisma({}),
      };
      const recipientService = {
        allowsSubscriptionTemplates: () => true,
        count: jest.fn(async () => 123),
      };

      const job = await makeService(
        prisma,
        undefined,
        recipientService
      ).createJob(
        {
          mailTemplateId: 'tpl-1',
          audience: { base: MailRecipientBase.hasSubscription },
        },
        'editor-1'
      );

      expect(recipientService.count).toHaveBeenCalled();
      expect(job.status).toBe('queued');
      expect(job.totalCount).toBe(123);
      expect(job.audience).toBe('filteredSubscriptions');
      expect(prisma.mailSendJob.create).toHaveBeenCalled();
    });

    it('maps the allUsers base to the allUsers audience', async () => {
      const prisma = {
        mailTemplate: { findUnique: jest.fn(async () => template('custom')) },
        ...drainSafePrisma({}),
      };
      const recipientService = {
        allowsSubscriptionTemplates: () => false,
        count: jest.fn(async () => 10),
      };

      const job = await makeService(
        prisma,
        undefined,
        recipientService
      ).createJob(
        {
          mailTemplateId: 'tpl-1',
          audience: { base: MailRecipientBase.allUsers },
        },
        'editor-1'
      );

      expect(job.audience).toBe('allUsers');
    });
  });

  describe('drain / processJob', () => {
    const buildDrainPrisma = (job: any, template: any) => {
      const updateCalls: any[] = [];
      return {
        updateCalls,
        prisma: {
          mailSendJob: {
            updateMany: jest.fn(async () => ({ count: 1 })),
            findMany: jest.fn(async () => [job]),
            findUnique: jest.fn(async () => job),
            update: jest.fn(async (args: any) => {
              updateCalls.push(args.data);
              return { ...job, ...args.data };
            }),
          },
          mailTemplate: { findUnique: jest.fn(async () => template) },
          invoice: { findFirst: jest.fn(async () => null) },
        },
      };
    };

    const audienceJob = {
      id: 'job-1',
      mailTemplateId: 'tpl-1',
      recipientFilter: { base: MailRecipientBase.allUsers },
    };

    it('sends to every recipient across pages and marks the job done', async () => {
      const { prisma, updateCalls } = buildDrainPrisma(
        audienceJob,
        template('custom')
      );
      const mailContext = { sendMail: jest.fn(async () => undefined) };
      const recipientService = {
        resolvePage: jest
          .fn()
          .mockResolvedValueOnce([
            { user: { id: 'u1', email: 'a@x.ch' } },
            { user: { id: 'u2', email: 'b@x.ch' } },
          ])
          .mockResolvedValueOnce([]),
      };

      await makeService(prisma, mailContext, recipientService).drain();

      expect(mailContext.sendMail).toHaveBeenCalledTimes(2);
      const final = updateCalls[updateCalls.length - 1];
      expect(final).toMatchObject({
        status: 'done',
        sentCount: 2,
        failedCount: 0,
      });
    });

    it('counts per-recipient failures but still finishes the job', async () => {
      const { prisma, updateCalls } = buildDrainPrisma(
        audienceJob,
        template('custom')
      );
      const mailContext = {
        sendMail: jest
          .fn()
          .mockResolvedValueOnce(undefined)
          .mockRejectedValueOnce(new Error('bounced')),
      };
      const recipientService = {
        resolvePage: jest
          .fn()
          .mockResolvedValueOnce([
            { user: { id: 'u1', email: 'a@x.ch' } },
            { user: { id: 'u2', email: 'b@x.ch' } },
          ])
          .mockResolvedValueOnce([]),
      };

      await makeService(prisma, mailContext, recipientService).drain();

      const final = updateCalls[updateCalls.length - 1];
      expect(final).toMatchObject({
        status: 'done',
        sentCount: 1,
        failedCount: 1,
      });
    });

    it('marks the job failed when its template disappears', async () => {
      const { prisma, updateCalls } = buildDrainPrisma(audienceJob, null);
      const recipientService = { resolvePage: jest.fn() };

      await makeService(
        prisma,
        { sendMail: jest.fn() },
        recipientService
      ).drain();

      expect(recipientService.resolvePage).not.toHaveBeenCalled();
      const final = updateCalls[updateCalls.length - 1];
      expect(final.status).toBe('failed');
    });

    it('does not process when the job cannot be claimed', async () => {
      const { prisma } = buildDrainPrisma(audienceJob, template('custom'));
      prisma.mailSendJob.updateMany = jest.fn(async () => ({ count: 0 }));
      const recipientService = { resolvePage: jest.fn() };

      await makeService(
        prisma,
        { sendMail: jest.fn() },
        recipientService
      ).drain();

      expect(recipientService.resolvePage).not.toHaveBeenCalled();
    });
  });
});
