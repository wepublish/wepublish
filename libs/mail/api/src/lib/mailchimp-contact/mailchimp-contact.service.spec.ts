import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient, SyncProviderType } from '@prisma/client';
import mailchimp from '@mailchimp/mailchimp_marketing';
import { SyncProviderSettingsService } from '@wepublish/settings/api';
import { createHash } from 'crypto';
import { MailchimpContactService } from './mailchimp-contact.service';
import type { Mock } from 'vitest';

vi.mock('@mailchimp/mailchimp_marketing', () => ({
  __esModule: true,
  default: {
    setConfig: vi.fn(),
    lists: {
      updateListMember: vi.fn(),
      getListMember: vi.fn(),
      deleteListMember: vi.fn(),
    },
  },
}));

const mailchimpStub = mailchimp as unknown as {
  setConfig: Mock;
  lists: {
    updateListMember: Mock;
    getListMember: Mock;
    deleteListMember: Mock;
  };
};

const configId = 'config-1';
const listId = 'list-1';
const userId = 'user-1';
const oldEmail = 'old@example.com';
const newEmail = 'new@example.com';

const oldEmail_HASH = createHash('md5').update(oldEmail).digest('hex');
const newEmail_HASH = createHash('md5').update(newEmail).digest('hex');

// As Mailchimp answered a rename on 2026-10-09
const INVALID_RESOURCE_DETAIL =
  "The resource submitted could not be validated. For field-specific details, see the 'errors' array.";
const ALREADY_IN_LIST_MESSAGE =
  '"new@example.com" is already in this list with a status of "Non-Subscribed".';

const mailchimpError = (
  status: number,
  title: string,
  detail: string,
  errors?: { field: string; message: string }[]
) => ({ status, response: { body: { status, title, detail, errors } } });

const givenContacts = (contacts: Record<string, object>) => {
  mailchimpStub.lists.getListMember.mockImplementation(
    async (_listId: string, subscriberHash: string) => {
      if (contacts[subscriberHash]) {
        return contacts[subscriberHash];
      }

      throw mailchimpError(
        404,
        'Resource Not Found',
        'The requested resource could not be found.'
      );
    }
  );
};

const syncConfig = {
  id: configId,
  type: SyncProviderType.MAILCHIMP,
  decryptedApiKey: 'apikey-us1',
  mailchimp_listId: listId,
};

describe('MailchimpContactService', () => {
  let service: MailchimpContactService;
  let prisma: {
    mailchimpSyncError: { upsert: Mock };
  };
  let syncProviderSettingsService: { getEnabledSyncConfigs: Mock };

  beforeEach(async () => {
    vi.clearAllMocks();

    mailchimpStub.lists.updateListMember.mockResolvedValue({});
    mailchimpStub.lists.deleteListMember.mockResolvedValue({});
    givenContacts({});

    prisma = {
      mailchimpSyncError: { upsert: vi.fn().mockResolvedValue({}) },
    };
    syncProviderSettingsService = {
      getEnabledSyncConfigs: vi.fn().mockResolvedValue([syncConfig]),
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

  it('records a sync error with the field details instead of throwing when mailchimp fails', async () => {
    mailchimpStub.lists.updateListMember.mockRejectedValue(
      mailchimpError(400, 'Invalid Resource', INVALID_RESOURCE_DETAIL, [
        {
          field: 'email address',
          message:
            'This member\'s status is "unsubscribed." You can only update email addresses for members with a status of "subscribed."',
        },
      ])
    );
    const errorMessage = `Invalid Resource: ${INVALID_RESOURCE_DETAIL} (email address: This member's status is "unsubscribed." You can only update email addresses for members with a status of "subscribed.")`;

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
        errorMessage,
        statusCode: 400,
      },
      update: {
        email: newEmail,
        errorMessage,
        statusCode: 400,
      },
    });
  });

  describe('when the new email is already a list member', () => {
    const placeholder = 'moved-new-contact@wepublish.ch';
    const placeholder_HASH = createHash('md5')
      .update(placeholder)
      .digest('hex');

    beforeEach(() => {
      mailchimpStub.lists.updateListMember.mockRejectedValueOnce(
        mailchimpError(400, 'Invalid Resource', INVALID_RESOURCE_DETAIL, [
          { field: 'email address', message: ALREADY_IN_LIST_MESSAGE },
        ])
      );
    });

    it('archives the existing contact under a placeholder and gives its email to the previous one', async () => {
      givenContacts({
        [oldEmail_HASH]: { status: 'subscribed', contact_id: 'old-contact' },
        [newEmail_HASH]: { status: 'subscribed', contact_id: 'new-contact' },
      });

      await service.updateContactEmail(userId, oldEmail, newEmail);

      expect(mailchimpStub.lists.updateListMember.mock.calls).toEqual([
        [listId, oldEmail_HASH, { email_address: newEmail }],
        [listId, newEmail_HASH, { email_address: placeholder }],
        [listId, oldEmail_HASH, { email_address: newEmail }],
      ]);
      expect(mailchimpStub.lists.deleteListMember).toHaveBeenCalledWith(
        listId,
        placeholder_HASH
      );
      const [, freed, moved] =
        mailchimpStub.lists.updateListMember.mock.invocationCallOrder;
      const [archived] =
        mailchimpStub.lists.deleteListMember.mock.invocationCallOrder;
      expect(archived).toBeGreaterThan(freed);
      expect(archived).toBeLessThan(moved);
      expect(prisma.mailchimpSyncError.upsert).not.toHaveBeenCalled();
    });

    it('leaves a previous contact that is not subscribed untouched', async () => {
      givenContacts({
        [oldEmail_HASH]: { status: 'unsubscribed', contact_id: 'old-contact' },
        [newEmail_HASH]: { status: 'subscribed', contact_id: 'new-contact' },
      });

      await service.updateContactEmail(userId, oldEmail, newEmail);

      expect(mailchimpStub.lists.updateListMember).toHaveBeenCalledTimes(1);
      expect(mailchimpStub.lists.deleteListMember).not.toHaveBeenCalled();
      expect(prisma.mailchimpSyncError.upsert).not.toHaveBeenCalled();
    });

    it('records a sync error when the existing contact is not subscribed', async () => {
      givenContacts({
        [oldEmail_HASH]: { status: 'subscribed', contact_id: 'old-contact' },
        [newEmail_HASH]: { status: 'cleaned', contact_id: 'new-contact' },
      });

      await service.updateContactEmail(userId, oldEmail, newEmail);

      expect(mailchimpStub.lists.updateListMember).toHaveBeenCalledTimes(1);
      expect(mailchimpStub.lists.deleteListMember).not.toHaveBeenCalled();
      expect(prisma.mailchimpSyncError.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            errorMessage: `Invalid Resource: ${INVALID_RESOURCE_DETAIL} (email address: ${ALREADY_IN_LIST_MESSAGE})`,
            statusCode: 400,
          }),
        })
      );
    });

    it('restores the existing contact when the previous one cannot take over its email', async () => {
      givenContacts({
        [oldEmail_HASH]: { status: 'subscribed', contact_id: 'old-contact' },
        [newEmail_HASH]: { status: 'subscribed', contact_id: 'new-contact' },
      });
      mailchimpStub.lists.updateListMember
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(
          mailchimpError(500, 'Internal Server Error', 'Something went wrong.')
        );

      await expect(
        service.updateContactEmail(userId, oldEmail, newEmail)
      ).resolves.toBeUndefined();

      expect(mailchimpStub.lists.updateListMember.mock.calls.slice(3)).toEqual([
        [listId, placeholder_HASH, { status: 'subscribed' }],
        [listId, placeholder_HASH, { email_address: newEmail }],
      ]);
      expect(prisma.mailchimpSyncError.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            errorMessage: 'Internal Server Error: Something went wrong.',
            statusCode: 500,
          }),
        })
      );
    });

    it('records where the existing contact is when it cannot be restored', async () => {
      givenContacts({
        [oldEmail_HASH]: { status: 'subscribed', contact_id: 'old-contact' },
        [newEmail_HASH]: { status: 'subscribed', contact_id: 'new-contact' },
      });
      mailchimpStub.lists.deleteListMember.mockRejectedValue(
        mailchimpError(500, 'Internal Server Error', 'Something went wrong.')
      );
      mailchimpStub.lists.updateListMember
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(
          mailchimpError(500, 'Internal Server Error', 'Still broken.')
        );

      await service.updateContactEmail(userId, oldEmail, newEmail);

      expect(prisma.mailchimpSyncError.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            errorMessage: `Could not give the contact of '${newEmail}' its email back, it is still '${placeholder}': Internal Server Error: Still broken.`,
          }),
        })
      );
    });
  });
});
