import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SyncProviderSettingsService } from '@wepublish/settings/api';
import { MailchimpContactStatus } from './mailchimp-subscribe.model';
import { MailchimpSubscribeService } from './mailchimp-subscribe.service';

describe('MailchimpSubscribeService', () => {
  let service: MailchimpSubscribeService;

  const mockSyncProviderSettingsService = {
    syncProviderSetting: jest.fn(),
  };

  const baseInput = {
    syncProviderId: 'provider',
    email: 'reader@example.com',
    status: MailchimpContactStatus.Subscribed,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

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

  it('should reject a multi-list subscription without a selected list', async () => {
    await expect(
      service.addContact({ ...baseInput, lists: [] })
    ).rejects.toThrow(BadRequestException);

    expect(
      mockSyncProviderSettingsService.syncProviderSetting
    ).not.toHaveBeenCalled();
  });

  it('should reject a multi-list subscription even if a listId is given', async () => {
    await expect(
      service.addContact({ ...baseInput, listId: 'list', lists: [] })
    ).rejects.toThrow('At least one newsletter has to be selected');
  });

  it('should reject a subscription without any list', async () => {
    await expect(service.addContact(baseInput)).rejects.toThrow(
      'No Mailchimp list given'
    );
  });
});
