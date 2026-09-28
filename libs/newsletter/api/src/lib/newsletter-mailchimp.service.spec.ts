import { UnprocessableEntityException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { SyncProviderType } from '@prisma/client';
import { SyncProviderSettingsService } from '@wepublish/settings/api';
import {
  editUrlFor,
  MailchimpCampaignError,
  NewsletterMailchimpService,
} from './newsletter-mailchimp.service';

const config = (overrides: Record<string, unknown> = {}) => ({
  id: 'mailchimp-sync',
  name: null,
  type: SyncProviderType.MAILCHIMP,
  enabled: true,
  decryptedApiKey: 'abc-us22',
  mailchimp_listId: 'list-1',
  ...overrides,
});

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

describe('NewsletterMailchimpService', () => {
  let service: NewsletterMailchimpService;
  let settings: { getEnabledSyncConfigs: jest.Mock };
  let fetchMock: jest.SpyInstance;

  beforeEach(async () => {
    settings = { getEnabledSyncConfigs: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        NewsletterMailchimpService,
        { provide: SyncProviderSettingsService, useValue: settings },
      ],
    }).compile();

    service = module.get(NewsletterMailchimpService);
    fetchMock = jest.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchMock.mockRestore();
  });

  it('reads the api key and audience from the enabled sync integration', async () => {
    settings.getEnabledSyncConfigs.mockResolvedValue([config()]);

    await expect(service.config()).resolves.toEqual({
      apiKey: 'abc-us22',
      listId: 'list-1',
    });
  });

  it('refuses without an integration and with several', async () => {
    settings.getEnabledSyncConfigs.mockResolvedValue([]);
    await expect(service.config()).rejects.toBeInstanceOf(
      UnprocessableEntityException
    );

    settings.getEnabledSyncConfigs.mockResolvedValue([
      config(),
      config({ id: 'other' }),
    ]);
    await expect(service.config()).rejects.toThrow(/Several/);
  });

  it('derives the datacenter from the key', () => {
    expect(editUrlFor('abc-us22', 7)).toBe(
      'https://us22.admin.mailchimp.com/campaigns/edit?id=7'
    );
    expect(() => editUrlFor('nodash', 7)).toThrow(MailchimpCampaignError);
  });

  it('picks the pinned audience and carries the sender defaults', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        lists: [
          { id: 'list-0', name: 'Other' },
          {
            id: 'list-1',
            name: 'Newsletter',
            campaign_defaults: { from_name: 'ee', from_email: 'a@b.c' },
          },
        ],
      })
    );

    await expect(
      service.fetchAudience({ apiKey: 'abc-us22', listId: 'list-1' })
    ).resolves.toEqual({
      id: 'list-1',
      name: 'Newsletter',
      fromName: 'ee',
      fromEmail: 'a@b.c',
    });
    expect(fetchMock.mock.calls[0][0]).toContain(
      'https://us22.api.mailchimp.com/3.0/lists'
    );
  });

  it('refuses to guess between several audiences', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        lists: [
          { id: 'list-0', name: 'A' },
          { id: 'list-1', name: 'B' },
        ],
      })
    );

    await expect(service.fetchAudience({ apiKey: 'abc-us22' })).rejects.toThrow(
      /several audiences/
    );
  });

  it('creates a draft without a template id and reports the edit url', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 'c1', web_id: 99 }));

    const campaign = await service.createDraftCampaign(
      'abc-us22',
      { id: 'list-1', name: 'N', fromName: 'ee', fromEmail: 'a@b.c' },
      { title: 'Issue', subject: '', previewText: 'pre' }
    );

    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body as string);

    expect(body).toEqual({
      type: 'regular',
      recipients: { list_id: 'list-1' },
      settings: {
        title: 'Issue',
        subject_line: 'Issue',
        preview_text: 'pre',
        from_name: 'ee',
        reply_to: 'a@b.c',
      },
    });
    expect(body.settings.template_id).toBeUndefined();
    expect(campaign).toEqual({
      id: 'c1',
      webId: 99,
      title: 'Issue',
      editUrl: 'https://us22.admin.mailchimp.com/campaigns/edit?id=99',
    });
  });

  it('reuses only drafts that are still editable', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ id: 'c1', web_id: 1, status: 'save' })
    );
    await expect(service.findReusableDraft('abc-us22', 'c1')).resolves.toEqual({
      id: 'c1',
      webId: 1,
    });

    fetchMock.mockResolvedValueOnce(
      jsonResponse({ id: 'c1', web_id: 1, status: 'sent' })
    );
    await expect(
      service.findReusableDraft('abc-us22', 'c1')
    ).resolves.toBeNull();

    fetchMock.mockResolvedValueOnce(
      jsonResponse({ title: 'Resource Not Found' }, 404)
    );
    await expect(
      service.findReusableDraft('abc-us22', 'c1')
    ).resolves.toBeNull();
  });

  it('surfaces mailchimp errors with their status and detail', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ detail: 'Your merge fields were invalid.' }, 400)
    );

    await expect(
      service.setCampaignHtml('abc-us22', 'c1', '<p>x</p>')
    ).rejects.toMatchObject({
      message: expect.stringContaining('merge fields were invalid'),
      status: 400,
    });
  });

  it('drops system tags from the audience merge fields', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        merge_fields: [
          { tag: 'FNAME', name: 'First name' },
          { tag: 'EMAIL', name: 'Email' },
        ],
      })
    );

    await expect(
      service.fetchMergeFields('abc-us22', 'list-1')
    ).resolves.toEqual([
      { tag: '*|FNAME|*', label: 'First name', description: 'FNAME' },
    ]);
  });
});
