import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import mailchimp from '@mailchimp/mailchimp_marketing';
import {
  SecretCrypto,
  SyncProviderSettingsService,
} from '@wepublish/settings/api';
import { createHash } from 'crypto';
import {
  MailchimpContactInput,
  MailchimpContactStatus,
} from './mailchimp-subscribe.model';
import { MailchimpSubscribeService } from './mailchimp-subscribe.service';

jest.mock('@mailchimp/mailchimp_marketing', () => ({
  __esModule: true,
  default: {
    setConfig: jest.fn(),
    lists: {
      setListMember: jest.fn(),
    },
  },
}));

process.env['APP_SECRET_KEY'] ??= 'test-secret-key-for-mailchimp-spec';

describe('MailchimpSubscribeService', () => {
  let service: MailchimpSubscribeService;

  const setListMember = mailchimp.lists.setListMember as jest.Mock;
  const setConfig = mailchimp.setConfig as jest.Mock;

  const mockSyncProviderSettingsService = {
    syncProviderSetting: jest.fn(),
  };

  const email = 'Reader@Example.com';
  const subscriberHash = createHash('md5')
    .update(email.toLowerCase())
    .digest('hex');

  const baseInput: MailchimpContactInput = {
    syncProviderId: 'provider',
    email,
    status: MailchimpContactStatus.Subscribed,
    mergeFields: { FNAME: 'Jane' },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockSyncProviderSettingsService.syncProviderSetting.mockResolvedValue({
      mailchimp_apiKey: new SecretCrypto().encrypt('secret-us21'),
    });
    setListMember.mockResolvedValue({});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailchimpSubscribeService,
        {
          provide: SyncProviderSettingsService,
          useValue: mockSyncProviderSettingsService,
        },
      ],
    }).compile();

    service = module.get(MailchimpSubscribeService);
  });

  describe('validation', () => {
    it('should reject a multi-list subscription without a selected list', async () => {
      await expect(
        service.addContact({ ...baseInput, lists: [] })
      ).rejects.toThrow(BadRequestException);

      expect(
        mockSyncProviderSettingsService.syncProviderSetting
      ).not.toHaveBeenCalled();
      expect(setListMember).not.toHaveBeenCalled();
    });

    it('should reject a multi-list subscription even if a listId is given', async () => {
      await expect(
        service.addContact({ ...baseInput, listId: 'list', lists: [] })
      ).rejects.toThrow('At least one newsletter has to be selected');

      expect(setListMember).not.toHaveBeenCalled();
    });

    it('should reject a subscription without any list', async () => {
      await expect(service.addContact(baseInput)).rejects.toThrow(
        'No Mailchimp list given'
      );

      expect(setListMember).not.toHaveBeenCalled();
    });

    it('should reject a sync provider without an API key', async () => {
      mockSyncProviderSettingsService.syncProviderSetting.mockResolvedValue({
        mailchimp_apiKey: null,
      });

      await expect(
        service.addContact({ ...baseInput, listId: 'list' })
      ).rejects.toThrow('Missing Mailchimp API key');

      expect(setListMember).not.toHaveBeenCalled();
    });
  });

  describe('single list', () => {
    it('should subscribe the contact to the given list', async () => {
      await service.addContact({
        ...baseInput,
        listId: 'list-daily',
        interests: { 'interest-1': true },
      });

      expect(setConfig).toHaveBeenCalledWith({
        apiKey: 'secret-us21',
        server: 'us21',
      });
      expect(setListMember).toHaveBeenCalledTimes(1);
      expect(setListMember).toHaveBeenCalledWith('list-daily', subscriberHash, {
        email_address: email,
        status_if_new: MailchimpContactStatus.Subscribed,
        status: MailchimpContactStatus.Subscribed,
        merge_fields: { FNAME: 'Jane' },
        interests: { 'interest-1': true },
      });
    });
  });

  describe('multiple lists', () => {
    it('should subscribe the contact to every selected list', async () => {
      await service.addContact({
        ...baseInput,
        status: MailchimpContactStatus.Pending,
        lists: [
          { listId: 'list-daily', interests: { 'interest-1': true } },
          { listId: 'list-weekly' },
        ],
      });

      expect(setListMember).toHaveBeenCalledTimes(2);
      expect(setListMember).toHaveBeenCalledWith('list-daily', subscriberHash, {
        email_address: email,
        status_if_new: MailchimpContactStatus.Pending,
        status: MailchimpContactStatus.Pending,
        merge_fields: { FNAME: 'Jane' },
        interests: { 'interest-1': true },
      });
      expect(setListMember).toHaveBeenCalledWith(
        'list-weekly',
        subscriberHash,
        {
          email_address: email,
          status_if_new: MailchimpContactStatus.Pending,
          status: MailchimpContactStatus.Pending,
          merge_fields: { FNAME: 'Jane' },
          interests: {},
        }
      );
    });

    it('should not leak top-level interests into the selected lists', async () => {
      await service.addContact({
        ...baseInput,
        interests: { 'interest-1': true },
        lists: [{ listId: 'list-weekly' }],
      });

      expect(setListMember).toHaveBeenCalledTimes(1);
      expect(setListMember).toHaveBeenCalledWith(
        'list-weekly',
        subscriberHash,
        expect.objectContaining({ interests: {} })
      );
    });

    it('should fail if subscribing to one of the lists fails', async () => {
      setListMember
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new Error('Invalid Resource'));

      await expect(
        service.addContact({
          ...baseInput,
          lists: [{ listId: 'list-daily' }, { listId: 'list-weekly' }],
        })
      ).rejects.toThrow('Invalid Resource');
    });
  });
});
