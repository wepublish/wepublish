import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import mailchimp from '@mailchimp/mailchimp_marketing';
import { SyncProviderSettingsService } from '@wepublish/settings/api';
import { MailchimpSyncService } from './mailchimp-sync.service';
import { ClickTrackingExtension } from './extensions/click-tracking.extension';

jest.mock('@mailchimp/mailchimp_marketing', () => ({
  __esModule: true,
  default: {
    setConfig: jest.fn(),
    lists: {
      getListMembersInfo: jest.fn(),
      getListMergeFields: jest.fn(),
    },
  },
}));

const mailchimpStub = mailchimp as unknown as {
  lists: {
    getListMembersInfo: jest.Mock;
    getListMergeFields: jest.Mock;
  };
};

const DAY_MS = 24 * 60 * 60 * 1000;

const daysAgo = (days: number) => new Date(Date.now() - days * DAY_MS);
const daysFromNow = (days: number) => new Date(Date.now() + days * DAY_MS);

const CONFIG_ID = 'config-1';

const NEWSLETTER_GROUP_ID = 'interest-newsletter';
const ABO_A_GROUP_ID = 'interest-abo-a';
const ABO_B_GROUP_ID = 'interest-abo-b';

const syncConfig = {
  id: CONFIG_ID,
  name: 'Test Sync',
  decryptedApiKey: 'apikey-us1',
  mailchimp_listId: 'list-1',
  mailchimp_mergeFieldMappings: [
    { tag: 'ACTIVE_ABO', expression: 'active_abo' },
    { tag: 'ABO_A', expression: 'slug:equals:abo-a' },
    { tag: 'ABO_B', expression: 'slug:equals:abo-b' },
    { tag: 'FNAME', expression: 'user.firstName' },
  ],
  mailchimp_interestGroupMappings: [
    { groupId: ABO_A_GROUP_ID, expression: 'slug:equals:abo-a' },
    { groupId: ABO_B_GROUP_ID, expression: 'slug:equals:abo-b' },
  ],
  mailchimp_defaultInterestGroupIds: [NEWSLETTER_GROUP_ID],
  mailchimp_extensions: {},
};

const mockUser = {
  id: 'user-1',
  email: 'New.User@example.com',
  firstName: 'Jane',
  name: 'Doe',
};

const buildSubscription = (overrides: Record<string, any> = {}) => ({
  id: 'sub-1',
  userID: mockUser.id,
  paidUntil: daysFromNow(365),
  startsAt: daysAgo(1),
  autoRenew: true,
  memberPlan: { slug: 'abo-a' },
  paymentMethod: { slug: 'stripe' },
  deactivation: null,
  replacesSubscriptionID: null,
  ...overrides,
});

const givenMailchimpContact = (overrides: Record<string, any> = {}) => {
  mailchimpStub.lists.getListMembersInfo.mockResolvedValue({
    members: [
      {
        email_address: mockUser.email.toLowerCase(),
        status: 'subscribed',
        merge_fields: {},
        interests: {},
        ...overrides,
      },
    ],
    total_items: 1,
  });
};

const prismaMock = {
  user: { findMany: jest.fn() },
  subscription: { findMany: jest.fn() },
  mailchimpSyncError: {
    findMany: jest.fn(),
  },
};

const syncProviderSettingsServiceMock = {
  getEnabledSyncConfigs: jest.fn(),
  updateSyncResult: jest.fn(),
};

describe('MailchimpSyncService', () => {
  let service: MailchimpSyncService;

  const dryRun = () => service.executeSyncById(CONFIG_ID, true);

  beforeEach(async () => {
    jest.clearAllMocks();

    prismaMock.user.findMany.mockResolvedValue([mockUser]);
    prismaMock.subscription.findMany.mockResolvedValue([]);
    prismaMock.mailchimpSyncError.findMany.mockResolvedValue([]);

    syncProviderSettingsServiceMock.getEnabledSyncConfigs.mockResolvedValue([
      syncConfig,
    ]);

    mailchimpStub.lists.getListMembersInfo.mockResolvedValue({
      members: [],
      total_items: 0,
    });
    mailchimpStub.lists.getListMergeFields.mockResolvedValue({
      merge_fields: [],
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailchimpSyncService,
        { provide: PrismaClient, useValue: prismaMock },
        {
          provide: SyncProviderSettingsService,
          useValue: syncProviderSettingsServiceMock,
        },
        {
          provide: ClickTrackingExtension,
          useValue: { execute: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<MailchimpSyncService>(MailchimpSyncService);
  });

  describe('newly created CMS user', () => {
    it('syncs a user missing on Mailchimp as a new contact', async () => {
      prismaMock.subscription.findMany.mockResolvedValue([buildSubscription()]);

      const result = await dryRun();

      expect(result).not.toBeNull();
      expect(result!.updatedCount).toBe(1);
      expect(result!.changes).toHaveLength(1);

      const change = result!.changes[0];
      expect(change.isNew).toBe(true);
      expect(change.email).toBe(mockUser.email);
      expect(change.previousMergeFields).toBeNull();
      expect(change.previousInterests).toBeNull();
      expect(change.mergeFields['ACTIVE_ABO']).toBe('1');
      expect(change.mergeFields['FNAME']).toBe('Jane');
      expect(change.interests[NEWSLETTER_GROUP_ID]).toBe(true);
      expect(change.interests[ABO_A_GROUP_ID]).toBe(true);
    });

    it('syncs a user without any subscription and leaves ACTIVE_ABO unset', async () => {
      const result = await dryRun();

      expect(result!.changes).toHaveLength(1);
      const change = result!.changes[0];
      expect(change.isNew).toBe(true);
      expect(change.mergeFields).not.toHaveProperty('ACTIVE_ABO');
      expect(change.interests).toEqual({
        [NEWSLETTER_GROUP_ID]: true,
        [ABO_A_GROUP_ID]: false,
        [ABO_B_GROUP_ID]: false,
      });
    });
  });

  describe('multiple active subscriptions', () => {
    const activeSubA = buildSubscription({
      id: 'sub-a',
      memberPlan: { slug: 'abo-a' },
      paidUntil: daysFromNow(30),
    });
    const activeSubB = buildSubscription({
      id: 'sub-b',
      memberPlan: { slug: 'abo-b' },
      paidUntil: daysFromNow(365),
    });

    beforeEach(() => {
      prismaMock.subscription.findMany.mockResolvedValue([
        activeSubA,
        activeSubB,
      ]);
    });

    it('syncs ACTIVE_ABO as active and every plan merge field as active', async () => {
      const result = await dryRun();

      const change = result!.changes[0];
      expect(change.mergeFields['ACTIVE_ABO']).toBe('1');
      expect(change.mergeFields['ABO_A']).toBe('1');
      expect(change.mergeFields['ABO_B']).toBe('1');
    });

    it('syncs the interest group of each active subscription as true', async () => {
      const result = await dryRun();

      const change = result!.changes[0];
      expect(change.interests[ABO_A_GROUP_ID]).toBe(true);
      expect(change.interests[ABO_B_GROUP_ID]).toBe(true);
    });

    it('keeps every plan merge field active for an existing contact that was marked inactive', async () => {
      givenMailchimpContact({
        merge_fields: { ACTIVE_ABO: '-1', ABO_A: '-1', ABO_B: '-1' },
        interests: {
          [NEWSLETTER_GROUP_ID]: true,
          [ABO_A_GROUP_ID]: false,
          [ABO_B_GROUP_ID]: false,
        },
      });

      const result = await dryRun();

      const change = result!.changes[0];
      expect(change.isNew).toBe(false);
      expect(change.mergeFields['ACTIVE_ABO']).toBe('1');
      expect(change.mergeFields['ABO_A']).toBe('1');
      expect(change.mergeFields['ABO_B']).toBe('1');
      expect(change.interests[ABO_A_GROUP_ID]).toBe(true);
      expect(change.interests[ABO_B_GROUP_ID]).toBe(true);
      expect(change.interests[NEWSLETTER_GROUP_ID]).toBe(true);
    });
  });

  describe('past subscription', () => {
    const endedSub = buildSubscription({
      id: 'sub-ended',
      startsAt: daysAgo(465),
      paidUntil: daysAgo(100),
      autoRenew: false,
      deactivation: { id: 'deactivation-1' },
    });

    beforeEach(() => {
      prismaMock.subscription.findMany.mockResolvedValue([endedSub]);
    });

    it('syncs ACTIVE_ABO as -1 when the only subscription ended in the past', async () => {
      const result = await dryRun();

      const change = result!.changes[0];
      expect(change.mergeFields['ACTIVE_ABO']).toBe('-1');
      expect(change.mergeFields['ABO_A']).toBe('-1');
      expect(change.mergeFields).not.toHaveProperty('ABO_B');
    });

    it('flips the subscription interest group to false for a contact that had it set', async () => {
      givenMailchimpContact({
        merge_fields: { ACTIVE_ABO: '1', ABO_A: '1' },
        interests: {
          [NEWSLETTER_GROUP_ID]: true,
          [ABO_A_GROUP_ID]: true,
        },
      });

      const result = await dryRun();

      const change = result!.changes[0];
      expect(change.mergeFields['ACTIVE_ABO']).toBe('-1');
      expect(change.interests[ABO_A_GROUP_ID]).toBe(false);
      expect(change.interests[NEWSLETTER_GROUP_ID]).toBe(true);
    });

    it('still syncs ACTIVE_ABO as -1 when the contact does not exist on Mailchimp yet', async () => {
      const result = await dryRun();

      const change = result!.changes[0];
      expect(change.isNew).toBe(true);
      expect(change.mergeFields['ACTIVE_ABO']).toBe('-1');
      expect(change.interests[ABO_A_GROUP_ID]).toBe(false);
    });
  });
});
