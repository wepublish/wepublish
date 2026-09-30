import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  NewsletterListLockedDisplay,
  NewsletterSubscriberSource,
  MailLogState,
  PrismaClient,
  UserEvent,
} from '@prisma/client';
import { createMock, PartialMocked } from '@wepublish/testing';
import { SettingName, SettingsService } from '@wepublish/settings/api';
import { MailContext, mailLogType } from '@wepublish/mail/api';
import { AUDIENCE_JWT_SERVICE } from '@wepublish/authentication/api';
import {
  NEWSLETTER_CONFIRMATION_AUDIENCE,
  NewsletterSubscriberService,
} from './newsletter-subscriber.service';
import { NewsletterEligibilityService } from './newsletter-eligibility.service';
import { NewsletterListUserStatus } from './my-newsletter-list.model';

const now = new Date('2026-06-15T12:00:00.000Z');

const mockList = (overrides: Record<string, unknown> = {}) => ({
  id: 'list-1',
  createdAt: new Date('2026-01-01'),
  modifiedAt: new Date('2026-01-01'),
  name: 'Morning Briefing',
  slug: 'morning-briefing',
  description: 'Every morning',
  active: true,
  requiresSubscription: false,
  anyMemberPlan: false,
  autoSubscribe: true,
  lockedDisplay: NewsletterListLockedDisplay.teaser,
  lockedText: null,
  lockedLinkUrl: null,
  memberPlans: [],
  ...overrides,
});

const gatedList = (overrides: Record<string, unknown> = {}) =>
  mockList({
    id: 'list-members',
    name: 'Members only',
    slug: 'members-only',
    requiresSubscription: true,
    memberPlans: [{ memberPlanId: 'plan-a' }],
    lockedText: 'Become a member',
    lockedLinkUrl: '/abo',
    ...overrides,
  });

const mockRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'row-1',
  createdAt: new Date('2026-01-01'),
  modifiedAt: new Date('2026-01-01'),
  userId: 'user-1',
  listId: 'list-1',
  source: NewsletterSubscriberSource.self,
  subscribedAt: new Date('2026-01-01'),
  confirmedAt: new Date('2026-01-01'),
  unsubscribedAt: null,
  ...overrides,
});

const activeSubscription = {
  memberPlanID: 'plan-a',
  confirmed: true,
  startsAt: new Date('2026-01-01'),
  paidUntil: new Date('2027-01-01'),
  gracePeriod: 0,
};

describe('NewsletterSubscriberService', () => {
  let service: NewsletterSubscriberService;
  let eligibility: PartialMocked<NewsletterEligibilityService>;
  let settings: PartialMocked<SettingsService>;
  let mailContext: PartialMocked<MailContext>;
  let jwt: { generateJWT: jest.Mock; verifyJWT: jest.Mock };
  let prismaMock: {
    newsletterList: { findMany: jest.Mock; findUnique: jest.Mock };
    newsletterSubscriber: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      upsert: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
      createMany: jest.Mock;
    };
    user: { findUnique: jest.Mock; update: jest.Mock };
    mailLog: { findFirst: jest.Mock };
    $transaction: jest.Mock;
  };

  const withDoubleOptIn = (enabled: boolean) =>
    settings.settingByName?.mockResolvedValue({
      id: 'setting-1',
      name: SettingName.NEWSLETTER_DOUBLE_OPT_IN,
      value: enabled,
    });

  const withSubscriptions = (subscriptions: (typeof activeSubscription)[]) =>
    eligibility.subscriptionsByUser?.mockResolvedValue(
      new Map([['user-1', subscriptions]])
    );

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(async () => {
    prismaMock = {
      newsletterList: { findMany: jest.fn(), findUnique: jest.fn() },
      newsletterSubscriber: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
        findFirst: jest.fn().mockResolvedValue(null),
        upsert: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'user-1',
          email: 'member@example.com',
          newsletterConfirmedAt: null,
        }),
        update: jest.fn(),
      },
      mailLog: { findFirst: jest.fn().mockResolvedValue(null) },
      $transaction: jest
        .fn()
        .mockImplementation(operations => Promise.all(operations)),
    };
    eligibility = createMock(NewsletterEligibilityService);
    settings = createMock(SettingsService);
    mailContext = createMock(MailContext);
    jwt = { generateJWT: jest.fn(), verifyJWT: jest.fn() };

    withSubscriptions([]);
    withDoubleOptIn(false);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NewsletterSubscriberService,
        { provide: PrismaClient, useValue: prismaMock },
        { provide: NewsletterEligibilityService, useValue: eligibility },
        { provide: SettingsService, useValue: settings },
        { provide: MailContext, useValue: mailContext },
        { provide: AUDIENCE_JWT_SERVICE, useValue: jwt },
      ],
    }).compile();

    service = module.get(NewsletterSubscriberService);
  });

  describe('getMyLists', () => {
    it('only loads active lists', async () => {
      prismaMock.newsletterList.findMany.mockResolvedValue([]);

      await service.getMyLists('user-1');

      expect(prismaMock.newsletterList.findMany).toHaveBeenCalledWith({
        where: { active: true },
        include: { memberPlans: true },
        orderBy: { name: 'asc' },
      });
    });

    it('maps the stored entries to a status per list', async () => {
      prismaMock.newsletterList.findMany.mockResolvedValue([
        mockList({ id: 'confirmed' }),
        mockList({ id: 'pending' }),
        mockList({ id: 'unsubscribed' }),
        mockList({ id: 'never' }),
      ]);
      prismaMock.newsletterSubscriber.findMany.mockResolvedValue([
        mockRow({ listId: 'confirmed' }),
        mockRow({ listId: 'pending', confirmedAt: null }),
        mockRow({ listId: 'unsubscribed', unsubscribedAt: now }),
      ]);

      const result = await service.getMyLists('user-1');

      expect(result.map(({ id, status }) => ({ id, status }))).toEqual([
        { id: 'confirmed', status: NewsletterListUserStatus.SUBSCRIBED },
        { id: 'pending', status: NewsletterListUserStatus.PENDING },
        { id: 'unsubscribed', status: NewsletterListUserStatus.NOT_SUBSCRIBED },
        { id: 'never', status: NewsletterListUserStatus.NOT_SUBSCRIBED },
      ]);
    });

    it('shows a subscriber-only list as locked with its promotion when the user has no qualifying subscription', async () => {
      prismaMock.newsletterList.findMany.mockResolvedValue([gatedList()]);

      await expect(service.getMyLists('user-1')).resolves.toEqual([
        {
          id: 'list-members',
          name: 'Members only',
          slug: 'members-only',
          description: 'Every morning',
          lockedText: 'Become a member',
          lockedLinkUrl: '/abo',
          status: NewsletterListUserStatus.LOCKED,
        },
      ]);
    });

    it('hides a locked list that is configured to be hidden', async () => {
      prismaMock.newsletterList.findMany.mockResolvedValue([
        gatedList({ lockedDisplay: NewsletterListLockedDisplay.hidden }),
      ]);

      await expect(service.getMyLists('user-1')).resolves.toEqual([]);
    });

    it('pauses a sign-up without a qualifying subscription so it can still be cancelled', async () => {
      prismaMock.newsletterList.findMany.mockResolvedValue([
        gatedList({ id: 'confirmed' }),
        gatedList({ id: 'pending' }),
        gatedList({ id: 'unsubscribed' }),
      ]);
      prismaMock.newsletterSubscriber.findMany.mockResolvedValue([
        mockRow({ listId: 'confirmed' }),
        mockRow({ listId: 'pending', confirmedAt: null }),
        mockRow({ listId: 'unsubscribed', unsubscribedAt: now }),
      ]);

      const result = await service.getMyLists('user-1');

      expect(result.map(({ id, status }) => ({ id, status }))).toEqual([
        { id: 'confirmed', status: NewsletterListUserStatus.PAUSED },
        { id: 'pending', status: NewsletterListUserStatus.PAUSED },
        { id: 'unsubscribed', status: NewsletterListUserStatus.LOCKED },
      ]);
    });

    it('still shows a paused sign-up on a list that is hidden for people without a subscription', async () => {
      prismaMock.newsletterList.findMany.mockResolvedValue([
        gatedList({ lockedDisplay: NewsletterListLockedDisplay.hidden }),
      ]);
      prismaMock.newsletterSubscriber.findMany.mockResolvedValue([
        mockRow({ listId: 'list-members' }),
      ]);

      const [list] = await service.getMyLists('user-1');

      expect(list.status).toBe(NewsletterListUserStatus.PAUSED);
    });

    it('unlocks a subscriber-only list for a qualifying subscription', async () => {
      prismaMock.newsletterList.findMany.mockResolvedValue([gatedList()]);
      prismaMock.newsletterSubscriber.findMany.mockResolvedValue([
        mockRow({ listId: 'list-members' }),
      ]);
      withSubscriptions([activeSubscription]);

      const [list] = await service.getMyLists('user-1');

      expect(list.status).toBe(NewsletterListUserStatus.SUBSCRIBED);
    });
  });

  describe('subscribe', () => {
    beforeEach(() => {
      prismaMock.newsletterList.findUnique.mockResolvedValue(mockList());
    });

    it('confirms immediately when double opt-in is off', async () => {
      prismaMock.newsletterSubscriber.upsert.mockResolvedValue(mockRow());

      const result = await service.subscribe('user-1', 'list-1');

      expect(prismaMock.newsletterSubscriber.upsert).toHaveBeenCalledWith({
        where: { userId_listId: { userId: 'user-1', listId: 'list-1' } },
        create: {
          userId: 'user-1',
          listId: 'list-1',
          source: NewsletterSubscriberSource.self,
          subscribedAt: now,
          confirmedAt: now,
        },
        update: {
          source: NewsletterSubscriberSource.self,
          subscribedAt: now,
          confirmedAt: now,
          unsubscribedAt: null,
        },
      });
      expect(result.status).toBe(NewsletterListUserStatus.SUBSCRIBED);
      expect(mailContext.sendMail).not.toHaveBeenCalled();
    });

    it('confirms a pending entry once double opt-in has been switched off', async () => {
      prismaMock.newsletterSubscriber.findUnique.mockResolvedValue(
        mockRow({ confirmedAt: null })
      );
      prismaMock.newsletterSubscriber.upsert.mockResolvedValue(mockRow());

      const result = await service.subscribe('user-1', 'list-1');

      expect(prismaMock.newsletterSubscriber.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({ confirmedAt: now }),
        })
      );
      expect(result.status).toBe(NewsletterListUserStatus.SUBSCRIBED);
    });

    it('treats a missing double opt-in setting as switched off', async () => {
      settings.settingByName?.mockRejectedValue(new Error('not found'));
      prismaMock.newsletterSubscriber.upsert.mockResolvedValue(mockRow());

      const result = await service.subscribe('user-1', 'list-1');

      expect(result.status).toBe(NewsletterListUserStatus.SUBSCRIBED);
    });

    it('keeps the entry pending and sends the confirmation mail when double opt-in is on', async () => {
      withDoubleOptIn(true);
      mailContext.getUserTemplateId?.mockResolvedValue('template-1');
      jwt.generateJWT.mockResolvedValue('confirm-token');
      mailContext.sendMail?.mockResolvedValue(undefined);
      prismaMock.newsletterSubscriber.upsert.mockResolvedValue(
        mockRow({ confirmedAt: null })
      );

      const result = await service.subscribe('user-1', 'list-1');

      expect(prismaMock.newsletterSubscriber.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ confirmedAt: null }),
          update: expect.objectContaining({ confirmedAt: null }),
        })
      );
      expect(mailContext.getUserTemplateId).toHaveBeenCalledWith(
        UserEvent.NEWSLETTER_CONFIRMATION,
        true
      );
      expect(jwt.generateJWT).toHaveBeenCalledWith({
        id: 'user-1',
        audience: NEWSLETTER_CONFIRMATION_AUDIENCE,
        expiresInMinutes: 10080,
      });
      expect(mailContext.sendMail).toHaveBeenCalledWith({
        mailTemplateId: 'template-1',
        recipient: expect.objectContaining({ id: 'user-1' }),
        optionalData: {
          newsletterList: {
            id: 'list-1',
            name: 'Morning Briefing',
            slug: 'morning-briefing',
          },
          confirmToken: 'confirm-token',
        },
        mailType: mailLogType.UserFlow,
      });
      expect(result.status).toBe(NewsletterListUserStatus.PENDING);
    });

    it('confirms immediately for a user who already completed double opt-in', async () => {
      withDoubleOptIn(true);
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-1',
        newsletterConfirmedAt: new Date('2026-02-01'),
      });
      prismaMock.newsletterSubscriber.upsert.mockResolvedValue(mockRow());

      const result = await service.subscribe('user-1', 'list-1');

      expect(result.status).toBe(NewsletterListUserStatus.SUBSCRIBED);
      expect(mailContext.sendMail).not.toHaveBeenCalled();
    });

    it('does not send another confirmation mail when one was sent to the user within the last minute', async () => {
      withDoubleOptIn(true);
      mailContext.getUserTemplateId?.mockResolvedValue('template-1');
      prismaMock.mailLog.findFirst.mockResolvedValue({ id: 'mail-log-1' });
      prismaMock.newsletterSubscriber.upsert.mockResolvedValue(
        mockRow({ confirmedAt: null })
      );

      const result = await service.subscribe('user-1', 'list-1');

      expect(prismaMock.mailLog.findFirst).toHaveBeenCalledWith({
        where: {
          recipientID: 'user-1',
          mailTemplateId: 'template-1',
          state: { not: MailLogState.rejected },
          sentDate: { gte: new Date(now.getTime() - 60_000) },
        },
      });
      expect(mailContext.sendMail).not.toHaveBeenCalled();
      expect(result.status).toBe(NewsletterListUserStatus.PENDING);
    });

    it('does not send another confirmation mail after switching a list off and on again', async () => {
      withDoubleOptIn(true);
      mailContext.getUserTemplateId?.mockResolvedValue('template-1');
      prismaMock.newsletterSubscriber.findUnique.mockResolvedValue(
        mockRow({ confirmedAt: null, unsubscribedAt: now })
      );
      prismaMock.mailLog.findFirst.mockResolvedValue({ id: 'mail-log-1' });
      prismaMock.newsletterSubscriber.upsert.mockResolvedValue(
        mockRow({ confirmedAt: null })
      );

      await service.subscribe('user-1', 'list-1');

      expect(mailContext.sendMail).not.toHaveBeenCalled();
    });

    it('sends the confirmation mail again when the previous send failed', async () => {
      withDoubleOptIn(true);
      mailContext.getUserTemplateId?.mockResolvedValue('template-1');
      jwt.generateJWT.mockResolvedValue('confirm-token');
      mailContext.sendMail?.mockResolvedValue(undefined);
      prismaMock.newsletterSubscriber.findFirst.mockResolvedValue(
        mockRow({
          confirmedAt: null,
          subscribedAt: new Date(now.getTime() - 30_000),
        })
      );
      prismaMock.mailLog.findFirst.mockResolvedValue(null);
      prismaMock.newsletterSubscriber.upsert.mockResolvedValue(
        mockRow({ confirmedAt: null })
      );

      await service.subscribe('user-1', 'list-1');

      expect(mailContext.sendMail).toHaveBeenCalled();
    });

    it('fails before storing anything when no confirmation mail template is configured', async () => {
      withDoubleOptIn(true);
      mailContext.getUserTemplateId?.mockRejectedValue(
        new Error('No UserFlowMail defined for event NEWSLETTER_CONFIRMATION')
      );

      await expect(service.subscribe('user-1', 'list-1')).rejects.toThrow(
        'No UserFlowMail defined for event NEWSLETTER_CONFIRMATION'
      );
      expect(prismaMock.newsletterSubscriber.upsert).not.toHaveBeenCalled();
    });

    it('rejects a subscriber-only list without a qualifying subscription', async () => {
      prismaMock.newsletterList.findUnique.mockResolvedValue(gatedList());

      await expect(
        service.subscribe('user-1', 'list-members')
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prismaMock.newsletterSubscriber.upsert).not.toHaveBeenCalled();
    });

    it('allows a subscriber-only list with a qualifying subscription', async () => {
      prismaMock.newsletterList.findUnique.mockResolvedValue(gatedList());
      withSubscriptions([activeSubscription]);
      prismaMock.newsletterSubscriber.upsert.mockResolvedValue(
        mockRow({ listId: 'list-members' })
      );

      const result = await service.subscribe('user-1', 'list-members');

      expect(result.status).toBe(NewsletterListUserStatus.SUBSCRIBED);
    });

    it('rejects an inactive list', async () => {
      prismaMock.newsletterList.findUnique.mockResolvedValue(
        mockList({ active: false })
      );

      await expect(
        service.subscribe('user-1', 'list-1')
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects an unknown list', async () => {
      prismaMock.newsletterList.findUnique.mockResolvedValue(null);

      await expect(
        service.subscribe('user-1', 'missing')
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('leaves an already confirmed entry untouched', async () => {
      prismaMock.newsletterSubscriber.findUnique.mockResolvedValue(mockRow());

      const result = await service.subscribe('user-1', 'list-1');

      expect(prismaMock.newsletterSubscriber.upsert).not.toHaveBeenCalled();
      expect(result.status).toBe(NewsletterListUserStatus.SUBSCRIBED);
    });
  });

  describe('unsubscribe', () => {
    beforeEach(() => {
      prismaMock.newsletterList.findUnique.mockResolvedValue(mockList());
    });

    it('keeps the entry and marks it as unsubscribed', async () => {
      prismaMock.newsletterSubscriber.findUnique.mockResolvedValue(mockRow());
      prismaMock.newsletterSubscriber.update.mockResolvedValue(
        mockRow({ unsubscribedAt: now })
      );

      const result = await service.unsubscribe('user-1', 'list-1');

      expect(prismaMock.newsletterSubscriber.update).toHaveBeenCalledWith({
        where: { id: 'row-1' },
        data: { unsubscribedAt: now },
      });
      expect(result.status).toBe(NewsletterListUserStatus.NOT_SUBSCRIBED);
    });

    it('cancels a pending confirmation', async () => {
      prismaMock.newsletterSubscriber.findUnique.mockResolvedValue(
        mockRow({ confirmedAt: null })
      );
      prismaMock.newsletterSubscriber.update.mockResolvedValue(
        mockRow({ confirmedAt: null, unsubscribedAt: now })
      );

      const result = await service.unsubscribe('user-1', 'list-1');

      expect(prismaMock.newsletterSubscriber.update).toHaveBeenCalled();
      expect(result.status).toBe(NewsletterListUserStatus.NOT_SUBSCRIBED);
    });

    it('locks a subscriber-only list again after cancelling a paused sign-up', async () => {
      prismaMock.newsletterList.findUnique.mockResolvedValue(gatedList());
      prismaMock.newsletterSubscriber.findUnique.mockResolvedValue(
        mockRow({ listId: 'list-members' })
      );
      prismaMock.newsletterSubscriber.update.mockResolvedValue(
        mockRow({ listId: 'list-members', unsubscribedAt: now })
      );

      const result = await service.unsubscribe('user-1', 'list-members');

      expect(result.status).toBe(NewsletterListUserStatus.LOCKED);
    });

    it('does nothing without an entry', async () => {
      const result = await service.unsubscribe('user-1', 'list-1');

      expect(prismaMock.newsletterSubscriber.update).not.toHaveBeenCalled();
      expect(result.status).toBe(NewsletterListUserStatus.NOT_SUBSCRIBED);
    });

    it('rejects an unknown list', async () => {
      prismaMock.newsletterList.findUnique.mockResolvedValue(null);

      await expect(
        service.unsubscribe('user-1', 'missing')
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('confirm', () => {
    it('confirms the user and every pending entry that was not unsubscribed', async () => {
      jwt.verifyJWT.mockResolvedValue('user-1');
      prismaMock.newsletterList.findMany.mockResolvedValue([]);

      await service.confirm('confirm-token');

      expect(jwt.verifyJWT).toHaveBeenCalledWith(
        'confirm-token',
        NEWSLETTER_CONFIRMATION_AUDIENCE
      );
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { newsletterConfirmedAt: now },
      });
      expect(prismaMock.newsletterSubscriber.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', confirmedAt: null, unsubscribedAt: null },
        data: { confirmedAt: now },
      });
      expect(prismaMock.$transaction).toHaveBeenCalled();
    });

    it('returns the lists of the confirmed user', async () => {
      jwt.verifyJWT.mockResolvedValue('user-1');
      prismaMock.newsletterList.findMany.mockResolvedValue([mockList()]);
      prismaMock.newsletterSubscriber.findMany.mockResolvedValue([mockRow()]);

      const result = await service.confirm('confirm-token');

      expect(result).toEqual([
        expect.objectContaining({
          id: 'list-1',
          status: NewsletterListUserStatus.SUBSCRIBED,
        }),
      ]);
    });

    it('rejects an invalid or expired token', async () => {
      jwt.verifyJWT.mockRejectedValue(new Error('Invalid JWT token'));

      await expect(service.confirm('broken')).rejects.toBeInstanceOf(
        BadRequestException
      );
      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });
  });

  describe('autoSubscribe', () => {
    it('adds the user to every matching automatic subscriber-only list', async () => {
      prismaMock.newsletterList.findMany.mockResolvedValue([
        { id: 'list-a' },
        { id: 'list-b' },
      ]);

      await service.autoSubscribe('user-1', 'plan-a');

      expect(prismaMock.newsletterList.findMany).toHaveBeenCalledWith({
        where: {
          active: true,
          requiresSubscription: true,
          autoSubscribe: true,
          OR: [
            { anyMemberPlan: true },
            { memberPlans: { some: { memberPlanId: 'plan-a' } } },
          ],
        },
        select: { id: true },
      });
      expect(prismaMock.newsletterSubscriber.createMany).toHaveBeenCalledWith({
        skipDuplicates: true,
        data: ['list-a', 'list-b'].map(listId => ({
          userId: 'user-1',
          listId,
          source: NewsletterSubscriberSource.auto,
          subscribedAt: now,
          confirmedAt: now,
        })),
      });
    });

    it('confirms pending entries but never touches unsubscribed ones', async () => {
      prismaMock.newsletterList.findMany.mockResolvedValue([{ id: 'list-a' }]);

      await service.autoSubscribe('user-1', 'plan-a');

      expect(prismaMock.newsletterSubscriber.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          listId: { in: ['list-a'] },
          confirmedAt: null,
          unsubscribedAt: null,
        },
        data: { confirmedAt: now },
      });
    });

    it('does nothing without matching lists', async () => {
      prismaMock.newsletterList.findMany.mockResolvedValue([]);

      await service.autoSubscribe('user-1', 'plan-a');

      expect(prismaMock.newsletterSubscriber.createMany).not.toHaveBeenCalled();
      expect(prismaMock.newsletterSubscriber.updateMany).not.toHaveBeenCalled();
    });
  });
});
