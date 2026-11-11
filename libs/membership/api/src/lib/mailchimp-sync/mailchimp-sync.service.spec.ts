import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import mailchimp from '@mailchimp/mailchimp_marketing';
import { SyncProviderSettingsService } from '@wepublish/settings/api';
import { MailchimpSyncService } from './mailchimp-sync.service';
import { ClickTrackingExtension } from './extensions/click-tracking.extension';
import { MailchimpAudienceEvidenceService } from './mailchimp-audience-evidence';
import { MailchimpCampaignClicksService } from './mailchimp-campaign-clicks';
import type { Mock } from 'vitest';

vi.mock('@mailchimp/mailchimp_marketing', () => ({
  __esModule: true,
  default: {
    setConfig: vi.fn(),
    lists: {
      getListMembersInfo: vi.fn(),
      getListMergeFields: vi.fn(),
      setListMember: vi.fn(),
    },
    batches: {
      start: vi.fn(),
      status: vi.fn(),
    },
  },
}));

const mailchimpStub = mailchimp as unknown as {
  lists: {
    getListMembersInfo: Mock;
    getListMergeFields: Mock;
    setListMember: Mock;
  };
  batches: {
    start: Mock;
    status: Mock;
  };
};

const invalidResourceError = (field: string, message: string) => ({
  status: 400,
  response: {
    body: {
      status: 400,
      title: 'Invalid Resource',
      detail:
        "The resource submitted could not be validated. For field-specific details, see the 'errors' array.",
      errors: [{ field, message }],
    },
  },
});

const INVALID_RESOURCE_MESSAGE =
  "Invalid Resource: The resource submitted could not be validated. For field-specific details, see the 'errors' array.";

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
  user: { findMany: vi.fn() },
  subscription: { findMany: vi.fn() },
  mailchimpSyncError: {
    findMany: vi.fn(),
    upsert: vi.fn(),
  },
};

const syncProviderSettingsServiceMock = {
  getEnabledSyncConfigs: vi.fn(),
  updateSyncResult: vi.fn(),
};

const audienceEvidence = {
  record: vi.fn().mockResolvedValue({ recorded: 0 }),
};

const campaignClicks = {
  record: vi.fn().mockResolvedValue({ campaigns: 0, recorded: 0 }),
};

describe('MailchimpSyncService', () => {
  let service: MailchimpSyncService;

  const dryRun = () => service.executeSyncById(CONFIG_ID, true);

  beforeEach(async () => {
    vi.clearAllMocks();

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
          useValue: { execute: vi.fn() },
        },
        { provide: MailchimpAudienceEvidenceService, useValue: audienceEvidence },
        { provide: MailchimpCampaignClicksService, useValue: campaignClicks },
      ],
    }).compile();

    service = module.get<MailchimpSyncService>(MailchimpSyncService);
  });

  it('keeps readably why a nightly sync failed', async () => {
    vi.spyOn(
      service as unknown as { executeSyncForConfig: () => Promise<void> },
      'executeSyncForConfig'
    ).mockRejectedValue({
      status: 401,
      title: 'API Key Invalid',
      detail:
        'Your API key may be invalid, or you have attempted to access the wrong datacenter.',
    });

    await service.executeAllSync();

    expect(
      syncProviderSettingsServiceMock.updateSyncResult
    ).toHaveBeenCalledWith(
      syncConfig.id,
      '401 Your API key may be invalid, or you have attempted to access the wrong datacenter.'
    );
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

  describe('sync errors', () => {
    it('records the field details of a contact Mailchimp rejects', async () => {
      mailchimpStub.batches.start.mockResolvedValue({
        id: 'batch-1',
        status: 'finished',
      });
      mailchimpStub.batches.status.mockResolvedValue({
        status: 'finished',
        errored_operations: 1,
      });
      mailchimpStub.lists.setListMember.mockRejectedValue(
        invalidResourceError('FNAME', 'Please enter a value')
      );

      await service.executeSyncById(CONFIG_ID);

      expect(prismaMock.mailchimpSyncError.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            email: mockUser.email,
            errorMessage: `Error updating contact '${mockUser.email}': ${INVALID_RESOURCE_MESSAGE} (FNAME: Please enter a value)`,
          }),
        })
      );
    });

    it('records the field details when Mailchimp rejects the whole batch', async () => {
      mailchimpStub.batches.start.mockRejectedValue(
        invalidResourceError('operations', 'Too many operations')
      );

      await service.executeSyncById(CONFIG_ID);

      expect(prismaMock.mailchimpSyncError.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            errorMessage: `Batch failed: ${INVALID_RESOURCE_MESSAGE} (operations: Too many operations)`,
          }),
        })
      );
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

  describe('audience status as email quality evidence', () => {
    const cleaned = {
      id: 'abc',
      email_address: mockUser.email.toLowerCase(),
      status: 'cleaned',
      last_changed: '2026-10-20T03:00:00+00:00',
      merge_fields: {},
      interests: {},
    };

    beforeEach(() => {
      mailchimpStub.lists.getListMembersInfo.mockResolvedValue({
        members: [cleaned],
        total_items: 1,
      });
    });

    it('asks Mailchimp for the fields the status needs', async () => {
      await service.executeSyncById(CONFIG_ID);

      expect(mailchimpStub.lists.getListMembersInfo).toHaveBeenCalledWith(
        syncConfig.mailchimp_listId,
        expect.objectContaining({
          fields: expect.arrayContaining([
            'members.id',
            'members.status',
            'members.unsubscribe_reason',
            'members.last_changed',
          ]),
        })
      );
    });

    it('hands the whole audience to the evidence on a real run', async () => {
      await service.executeSyncById(CONFIG_ID);

      expect(audienceEvidence.record).toHaveBeenCalledWith(
        syncConfig.mailchimp_listId,
        [cleaned]
      );
    });

    it('reads the clicks of the last week of campaigns on a real run', async () => {
      const before = Date.now();

      await service.executeSyncById(CONFIG_ID);

      expect(campaignClicks.record).toHaveBeenCalledTimes(1);
      const [listId, since] = campaignClicks.record.mock.calls[0];
      expect(listId).toBe(syncConfig.mailchimp_listId);
      expect(before - since.getTime()).toBeGreaterThanOrEqual(7 * DAY_MS);
      expect(before - since.getTime()).toBeLessThan(7 * DAY_MS + 60_000);
    });

    it('records nothing on a dry run', async () => {
      await dryRun();

      expect(audienceEvidence.record).not.toHaveBeenCalled();
      expect(campaignClicks.record).not.toHaveBeenCalled();
    });

    it('still syncs the contacts when the evidence fails', async () => {
      audienceEvidence.record.mockRejectedValueOnce(new Error('db down'));
      campaignClicks.record.mockRejectedValueOnce(new Error('rate limited'));

      await expect(service.executeSyncById(CONFIG_ID)).resolves.not.toThrow();
      expect(
        syncProviderSettingsServiceMock.updateSyncResult
      ).toHaveBeenCalledWith(CONFIG_ID);
    });
  });
});
