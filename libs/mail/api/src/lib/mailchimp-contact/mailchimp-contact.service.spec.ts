import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient, SyncProviderType } from '@prisma/client';
import mailchimp from '@mailchimp/mailchimp_marketing';
import { SyncProviderSettingsService } from '@wepublish/settings/api';
import { createHash } from 'crypto';
import { MailchimpContactService } from './mailchimp-contact.service';

jest.mock('@mailchimp/mailchimp_marketing', () => ({
  __esModule: true,
  default: {
    setConfig: jest.fn(),
    lists: {
      updateListMember: jest.fn(),
    },
  },
}));

const mailchimpStub = mailchimp as unknown as {
  setConfig: jest.Mock;
  lists: {
    updateListMember: jest.Mock;
  };
};

const configId = 'config-1';
const listId = 'list-1';
const userId = 'user-1';
const oldEmail = 'old@example.com';
const newEmail = 'new@example.com';

const oldEmail_HASH = createHash('md5').update(oldEmail).digest('hex');

const syncConfig = {
  id: configId,
  type: SyncProviderType.MAILCHIMP,
  decryptedApiKey: 'apikey-us1',
  mailchimp_listId: listId,
};

describe('MailchimpContactService', () => {
  let service: MailchimpContactService;
  let prisma: {
    mailchimpSyncError: { upsert: jest.Mock };
  };
  let syncProviderSettingsService: { getEnabledSyncConfigs: jest.Mock };

  beforeEach(async () => {
    jest.clearAllMocks();

    prisma = {
      mailchimpSyncError: { upsert: jest.fn().mockResolvedValue({}) },
    };
    syncProviderSettingsService = {
      getEnabledSyncConfigs: jest.fn().mockResolvedValue([syncConfig]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailchimpContactService,
        { provide: PrismaClient, useValue: prisma },
        {
          provide: SyncProviderSettingsService,
          useValue: syncProviderSettingsService,
        },
      ],
    }).compile();

    service = module.get(MailchimpContactService);
  });

  it('renames the contact of the previous email address', async () => {
    await service.updateContactEmail(userId, oldEmail, newEmail);

    expect(mailchimpStub.setConfig).toHaveBeenCalledWith({
      apiKey: 'apikey-us1',
      server: 'us1',
    });
    expect(mailchimpStub.lists.updateListMember).toHaveBeenCalledWith(
      listId,
      oldEmail_HASH,
      { email_address: newEmail }
    );
  });

  it('normalizes both email addresses', async () => {
    await service.updateContactEmail(userId, ' Old@Example.com ', 'NEW@ex.com');

    expect(mailchimpStub.lists.updateListMember).toHaveBeenCalledWith(
      listId,
      oldEmail_HASH,
      { email_address: 'new@ex.com' }
    );
  });

  it('does nothing when the email did not change', async () => {
    await service.updateContactEmail(userId, oldEmail, 'OLD@example.com');

    expect(mailchimpStub.lists.updateListMember).not.toHaveBeenCalled();
  });

  it('skips sync providers without an api key or list', async () => {
    syncProviderSettingsService.getEnabledSyncConfigs.mockResolvedValue([
      { ...syncConfig, decryptedApiKey: null },
      { ...syncConfig, mailchimp_listId: null },
    ]);

    await service.updateContactEmail(userId, oldEmail, newEmail);

    expect(mailchimpStub.lists.updateListMember).not.toHaveBeenCalled();
  });

  it('ignores contacts that do not exist in the audience', async () => {
    mailchimpStub.lists.updateListMember.mockRejectedValue({
      response: { body: { status: 404, title: 'Resource Not Found' } },
    });

    await service.updateContactEmail(userId, oldEmail, newEmail);

    expect(prisma.mailchimpSyncError.upsert).not.toHaveBeenCalled();
  });

  it('records a sync error instead of throwing when mailchimp fails', async () => {
    mailchimpStub.lists.updateListMember.mockRejectedValue({
      response: {
        body: {
          status: 400,
          title: 'Member Exists',
          detail: 'new@example.com is already a list member.',
        },
      },
    });

    await expect(
      service.updateContactEmail(userId, oldEmail, newEmail)
    ).resolves.toBeUndefined();

    expect(prisma.mailchimpSyncError.upsert).toHaveBeenCalledWith({
      where: {
        userId_syncProviderId: {
          userId,
          syncProviderId: configId,
        },
      },
      create: {
        userId,
        syncProviderId: configId,
        email: newEmail,
        errorMessage:
          'Member Exists: new@example.com is already a list member.',
        statusCode: 400,
      },
      update: {
        email: newEmail,
        errorMessage:
          'Member Exists: new@example.com is already a list member.',
        statusCode: 400,
      },
    });
  });
});
