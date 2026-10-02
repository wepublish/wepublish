import type { Mock } from 'vitest';
import { Test } from '@nestjs/testing';
import { SyncProviderSettingsService } from '@wepublish/settings/api';
import { NewsletterMailchimpService } from './newsletter-mailchimp.service';

const fields = {
  title: 'Ausgabe 1',
  subject: 'Ausgabe 1',
  previewText: 'Vorschau',
};

type Call = { method: string; path: string; body?: unknown };

const fakeMailchimp = (responses: Record<string, unknown>) => {
  const calls: Call[] = [];

  vi.spyOn(global, 'fetch').mockImplementation(async (input, init) => {
    const url = new URL(String(input));
    const method = init?.method ?? 'GET';
    const path = url.pathname.replace('/3.0', '');
    calls.push({
      method,
      path,
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    });

    const key = `${method} ${path}`;

    if (!(key in responses)) {
      return new Response(JSON.stringify({ detail: 'Resource Not Found' }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify(responses[key]), { status: 200 });
  });

  return calls;
};

describe('NewsletterMailchimpService', () => {
  let service: NewsletterMailchimpService;
  let configs: Mock;

  beforeEach(async () => {
    vi.restoreAllMocks();
    configs = vi.fn().mockResolvedValue([
      {
        type: 'MAILCHIMP',
        enabled: true,
        decryptedApiKey: 'secret-us21',
        mailchimp_listId: 'list-1',
      },
    ]);

    const module = await Test.createTestingModule({
      providers: [
        NewsletterMailchimpService,
        {
          provide: SyncProviderSettingsService,
          useValue: { getEnabledSyncConfigs: configs },
        },
      ],
    }).compile();

    service = module.get(NewsletterMailchimpService);
  });

  it('refuses when no Mailchimp integration is set up', async () => {
    configs.mockResolvedValue([]);

    await expect(
      service.pushDraft(undefined, fields, '<html/>')
    ).rejects.toThrow('Mailchimp-Integration');
  });

  it('creates a draft without a template and uploads the html', async () => {
    const calls = fakeMailchimp({
      'GET /lists/list-1': {
        id: 'list-1',
        name: 'Newsletter',
        campaign_defaults: {
          from_name: 'ee-news',
          from_email: 'hi@ee-news.ch',
        },
      },
      'POST /campaigns': { id: 'campaign-1', web_id: 42 },
      'PUT /campaigns/campaign-1/content': {},
    });

    const result = await service.pushDraft(undefined, fields, '<html/>');

    expect(result).toEqual({
      created: true,
      campaign: {
        id: 'campaign-1',
        webId: 42,
        title: 'Ausgabe 1',
        editUrl: 'https://us21.admin.mailchimp.com/campaigns/edit?id=42',
      },
    });
    expect(calls.map(call => `${call.method} ${call.path}`)).toEqual([
      'GET /lists/list-1',
      'POST /campaigns',
      'PUT /campaigns/campaign-1/content',
    ]);
    expect(calls[1].body).toEqual({
      type: 'regular',
      recipients: { list_id: 'list-1' },
      settings: {
        title: 'Ausgabe 1',
        subject_line: 'Ausgabe 1',
        preview_text: 'Vorschau',
        from_name: 'ee-news',
        reply_to: 'hi@ee-news.ch',
      },
    });
    expect(calls[2].body).toEqual({ html: '<html/>' });
  });

  it('patches the remembered draft before uploading the html', async () => {
    const calls = fakeMailchimp({
      'GET /campaigns/campaign-1': {
        id: 'campaign-1',
        web_id: 42,
        status: 'save',
      },
      'PATCH /campaigns/campaign-1': {},
      'PUT /campaigns/campaign-1/content': {},
    });

    const result = await service.pushDraft('campaign-1', fields, '<html/>');

    expect(result.created).toBe(false);
    expect(calls.map(call => `${call.method} ${call.path}`)).toEqual([
      'GET /campaigns/campaign-1',
      'PATCH /campaigns/campaign-1',
      'PUT /campaigns/campaign-1/content',
    ]);
  });

  it.each([
    ['was sent', { id: 'campaign-1', web_id: 42, status: 'sent' }],
    ['was deleted', undefined],
  ])(
    'creates a new draft when the remembered one %s',
    async (_, remembered) => {
      const calls = fakeMailchimp({
        ...(remembered ? { 'GET /campaigns/campaign-1': remembered } : {}),
        'GET /lists/list-1': { id: 'list-1', name: 'Newsletter' },
        'POST /campaigns': { id: 'campaign-2', web_id: 43 },
        'PUT /campaigns/campaign-2/content': {},
      });

      const result = await service.pushDraft('campaign-1', fields, '<html/>');

      expect(result.created).toBe(true);
      expect(calls.map(call => call.method)).not.toContain('PATCH');
    }
  );

  it('builds the link to a draft from the datacenter of the key', async () => {
    expect(await service.editUrls()).toEqual(expect.any(Function));
    expect((await service.editUrls())?.(42)).toBe(
      'https://us21.admin.mailchimp.com/campaigns/edit?id=42'
    );
  });

  it('offers the audience fields and groups, minus system tags and unusable names', async () => {
    fakeMailchimp({
      'GET /lists/list-1/merge-fields': {
        merge_fields: [
          { tag: 'FNAME', name: 'Vorname' },
          { tag: 'EMAIL', name: 'E-Mail' },
        ],
      },
      'GET /lists/list-1/interest-categories': {
        categories: [
          { id: 'c1', title: 'Kundschaft' },
          { id: 'c2', title: 'Kaputt: Kategorie' },
        ],
      },
      'GET /lists/list-1/interest-categories/c1/interests': {
        interests: [{ name: 'Stammkundschaft' }, { name: 'a,b' }],
      },
    });

    expect(await service.mergeFields()).toEqual({
      fields: [
        {
          tag: '*|FNAME|*',
          label: 'Vorname',
          description: 'Feld «FNAME» aus dem Mailchimp-Publikum.',
        },
      ],
      interests: [{ title: 'Kundschaft', groups: ['Stammkundschaft'] }],
      error: undefined,
    });
  });

  it('answers without fields but with a reason when no integration is set up', async () => {
    configs.mockResolvedValue([]);

    expect(await service.mergeFields()).toEqual({
      fields: [],
      interests: [],
      error: expect.stringContaining('System-Merge-Tags'),
    });
  });
});
