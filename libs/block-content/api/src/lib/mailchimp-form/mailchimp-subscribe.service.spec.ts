import type { Mock } from 'vitest';
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

vi.mock('@mailchimp/mailchimp_marketing', () => ({
  __esModule: true,
  default: {
    setConfig: vi.fn(),
    lists: {
      setListMember: vi.fn(),
    },
  },
}));

process.env['APP_SECRET_KEY'] ??= 'test-secret-key-for-mailchimp-spec';

describe('MailchimpSubscribeService', () => {
  let service: MailchimpSubscribeService;

  const setListMember = mailchimp.lists.setListMember as Mock;
  const setConfig = mailchimp.setConfig as Mock;

  const mockSyncProviderSettingsService = {
    syncProviderSetting: vi.fn(),
  };

  const email = 'Reader@Example.com';
  const subscriberHash = createHash('md5')
    .update(email.toLowerCase())
    .digest('hex');

  const baseInput: MailchimpContactInput = {
    syncProviderId: 'provider',
    email,
    status: MailchimpContactStatus.Subscribed,
    listId: 'list-daily',
    mergeFields: { FNAME: 'Jane' },
  };

  beforeEach(async () => {
    vi.clearAllMocks();

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

  it('should reject a sync provider without an API key', async () => {
    mockSyncProviderSettingsService.syncProviderSetting.mockResolvedValue({
      mailchimp_apiKey: null,
    });

    await expect(service.addContact(baseInput)).rejects.toThrow(
      'Missing Mailchimp API key'
    );

    expect(setListMember).not.toHaveBeenCalled();
  });

  it('should reject an API key without a server suffix', async () => {
    mockSyncProviderSettingsService.syncProviderSetting.mockResolvedValue({
      mailchimp_apiKey: new SecretCrypto().encrypt('secret'),
    });

    await expect(service.addContact(baseInput)).rejects.toThrow(
      'Invalid Mailchimp API key format'
    );

    expect(setListMember).not.toHaveBeenCalled();
  });

  it('should subscribe the contact with the selected interests', async () => {
    await service.addContact({
      ...baseInput,
      interests: { 'interest-1': true, 'interest-2': true },
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
      interests: { 'interest-1': true, 'interest-2': true },
    });
  });

  it('should default to empty merge fields and interests', async () => {
    await service.addContact({
      ...baseInput,
      status: MailchimpContactStatus.Pending,
      mergeFields: undefined,
    });

    expect(setListMember).toHaveBeenCalledWith('list-daily', subscriberHash, {
      email_address: email,
      status_if_new: MailchimpContactStatus.Pending,
      status: MailchimpContactStatus.Pending,
      merge_fields: {},
      interests: {},
    });
  });

  it('should fail if Mailchimp rejects the subscription', async () => {
    setListMember.mockRejectedValueOnce(new Error('Invalid Resource'));

    await expect(service.addContact(baseInput)).rejects.toThrow(
      'Invalid Resource'
    );
  });
});
