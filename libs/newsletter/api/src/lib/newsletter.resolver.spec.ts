import { INestApplication } from '@nestjs/common';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { Test } from '@nestjs/testing';
import type { NewsletterDocument } from '@wepublish/newsletter';
import { createMock, PartialMocked } from '@wepublish/testing';
import request from 'supertest';
import { NewsletterContentService } from './newsletter-content.service';
import { NewsletterMailchimpService } from './newsletter-mailchimp.service';
import { NewsletterResolver } from './newsletter.resolver';
import { NewsletterService } from './newsletter.service';

const newsletter = {
  id: 'n1',
  createdAt: new Date('2026-01-01'),
  modifiedAt: new Date('2026-01-02'),
  title: 'Issue 1',
  document: {
    preheader: 'pre',
    blocks: [
      { type: 'teaser', variant: 'big', articleId: 'a1' },
      { type: 'footer', title: 'ee', lines: [] },
    ],
  } as NewsletterDocument,
  mailchimpCampaignId: null,
  mailchimpCampaignWebId: null,
};

const article = {
  id: 'a1',
  title: 'Headline',
  preTitle: null,
  lead: 'Lead',
  url: 'https://site/a/x',
  imageUrl: null,
  publishedAt: new Date('2026-01-01'),
  tags: ['solar'],
};

const okReport = {
  bytes: 1000,
  missingFooter: [],
  missingArticles: [],
  missingImages: [],
};

const gql = (app: INestApplication, query: string, variables?: unknown) =>
  request(app.getHttpServer()).post('').send({ query, variables });

describe('NewsletterResolver', () => {
  let app: INestApplication;
  let newsletters: PartialMocked<NewsletterService>;
  let content: PartialMocked<NewsletterContentService>;
  let mailchimp: PartialMocked<NewsletterMailchimpService>;

  beforeAll(async () => {
    newsletters = createMock(NewsletterService);
    content = createMock(NewsletterContentService);
    mailchimp = createMock(NewsletterMailchimpService);

    const module = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
          path: '/',
          cache: 'bounded',
        }),
      ],
      providers: [
        NewsletterResolver,
        { provide: NewsletterService, useValue: newsletters },
        { provide: NewsletterContentService, useValue: content },
        { provide: NewsletterMailchimpService, useValue: mailchimp },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('newsletter query resolves the derived fields', async () => {
    newsletters.findById?.mockResolvedValue(newsletter);
    content.articlesByIds?.mockResolvedValue(new Map([['a1', article]]));
    content.imagesFor?.mockResolvedValue(new Map());
    mailchimp.config?.mockResolvedValue({ apiKey: 'k-us22' });

    const response = await gql(
      app,
      `query ($id: String!) {
        newsletter(id: $id) {
          id title blockCount mailchimpEditUrl
          teaserArticles { id title tags }
          images { id }
        }
      }`,
      { id: 'n1' }
    ).expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.newsletter).toEqual({
      id: 'n1',
      title: 'Issue 1',
      blockCount: 2,
      mailchimpEditUrl: null,
      teaserArticles: [{ id: 'a1', title: 'Headline', tags: ['solar'] }],
      images: [],
    });
    expect(content.articlesByIds).toHaveBeenCalledWith(['a1']);
  });

  test('mailchimpEditUrl is built from the configured key', async () => {
    newsletters.findById?.mockResolvedValue({
      ...newsletter,
      mailchimpCampaignId: 'c1',
      mailchimpCampaignWebId: 55,
    });
    mailchimp.config?.mockResolvedValue({ apiKey: 'k-us22' });

    const response = await gql(
      app,
      `query { newsletter(id: "n1") { mailchimpEditUrl } }`
    ).expect(200);

    expect(response.body.data.newsletter.mailchimpEditUrl).toBe(
      'https://us22.admin.mailchimp.com/campaigns/edit?id=55'
    );
  });

  test('publish creates a draft on first publish and uploads settings before html', async () => {
    newsletters.findById?.mockResolvedValue(newsletter);
    newsletters.recordCampaign?.mockResolvedValue(undefined);
    content.render?.mockResolvedValue({
      html: '<p>*|UNSUB|* *|LIST:ADDRESSLINE|*</p>',
      report: okReport,
    });
    mailchimp.config?.mockResolvedValue({ apiKey: 'k-us22', listId: 'l1' });
    mailchimp.fetchAudience?.mockResolvedValue({ id: 'l1', name: 'N' });
    mailchimp.createDraftCampaign?.mockResolvedValue({
      id: 'c1',
      webId: 9,
      title: 'Issue 1',
      editUrl: 'https://us22.admin.mailchimp.com/campaigns/edit?id=9',
    });
    mailchimp.setCampaignHtml?.mockResolvedValue(undefined);

    const response = await gql(
      app,
      `mutation { publishNewsletterToMailchimp(id: "n1") { created campaign { id webId editUrl } report { bytes } } }`
    ).expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.publishNewsletterToMailchimp).toEqual({
      created: true,
      campaign: {
        id: 'c1',
        webId: 9,
        editUrl: 'https://us22.admin.mailchimp.com/campaigns/edit?id=9',
      },
      report: { bytes: 1000 },
    });
    expect(mailchimp.createDraftCampaign).toHaveBeenCalledWith(
      'k-us22',
      { id: 'l1', name: 'N' },
      { title: 'Issue 1', subject: 'Issue 1', previewText: 'pre' }
    );
    expect(mailchimp.setCampaignHtml).toHaveBeenCalledWith(
      'k-us22',
      'c1',
      '<p>*|UNSUB|* *|LIST:ADDRESSLINE|*</p>'
    );
    expect(newsletters.recordCampaign).toHaveBeenCalledWith('n1', 'c1', 9);
  });

  test('publish patches the remembered draft when it is still editable', async () => {
    newsletters.findById?.mockResolvedValue({
      ...newsletter,
      mailchimpCampaignId: 'c1',
      mailchimpCampaignWebId: 9,
    });
    newsletters.recordCampaign?.mockResolvedValue(undefined);
    content.render?.mockResolvedValue({
      html: '*|UNSUB|* *|LIST:ADDRESS|*',
      report: okReport,
    });
    mailchimp.config?.mockResolvedValue({ apiKey: 'k-us22' });
    mailchimp.findReusableDraft?.mockResolvedValue({ id: 'c1', webId: 9 });
    mailchimp.updateDraftCampaign?.mockResolvedValue(undefined);
    mailchimp.setCampaignHtml?.mockResolvedValue(undefined);

    const response = await gql(
      app,
      `mutation { publishNewsletterToMailchimp(id: "n1") { created campaign { id } } }`
    ).expect(200);

    expect(response.body.data.publishNewsletterToMailchimp).toEqual({
      created: false,
      campaign: { id: 'c1' },
    });
    expect(mailchimp.createDraftCampaign).not.toHaveBeenCalled();
    expect(
      mailchimp.updateDraftCampaign?.mock.invocationCallOrder[0]
    ).toBeLessThan(
      mailchimp.setCampaignHtml?.mock.invocationCallOrder[0] as number
    );
  });

  test('publish refuses an issue whose footer lost the required tags', async () => {
    newsletters.findById?.mockResolvedValue(newsletter);
    content.render?.mockResolvedValue({
      html: '<p>no tags</p>',
      report: { ...okReport, missingFooter: ['unsubscribe', 'address'] },
    });
    mailchimp.config?.mockResolvedValue({ apiKey: 'k-us22' });

    const response = await gql(
      app,
      `mutation { publishNewsletterToMailchimp(id: "n1") { created } }`
    ).expect(200);

    expect(response.body.errors?.[0]?.message).toMatch(/unsubscribe link/);
    expect(mailchimp.setCampaignHtml).not.toHaveBeenCalled();
  });

  test('publish refuses an issue with a teaser the CMS no longer returns', async () => {
    newsletters.findById?.mockResolvedValue(newsletter);
    content.render?.mockResolvedValue({
      html: '*|UNSUB|* *|LIST:ADDRESS|*',
      report: { ...okReport, missingArticles: ['a1'] },
    });
    mailchimp.config?.mockResolvedValue({ apiKey: 'k-us22' });

    const response = await gql(
      app,
      `mutation { publishNewsletterToMailchimp(id: "n1") { created } }`
    ).expect(200);

    expect(response.body.errors?.[0]?.message).toMatch(/could not be loaded/);
  });

  test('merge field catalogue reports a missing integration in the payload', async () => {
    mailchimp.config?.mockRejectedValue(
      new Error('No enabled Mailchimp integration')
    );

    const response = await gql(
      app,
      `query { newsletterMergeFields { fields { tag } interests { title } error } }`
    ).expect(200);

    expect(response.body.data.newsletterMergeFields).toEqual({
      fields: [],
      interests: [],
      error: 'No enabled Mailchimp integration',
    });
  });

  test('merge field catalogue keeps the fields when only the groups fail', async () => {
    mailchimp.config?.mockResolvedValue({ apiKey: 'k-us22' });
    mailchimp.fetchAudience?.mockResolvedValue({ id: 'l1', name: 'N' });
    mailchimp.fetchMergeFields?.mockResolvedValue([
      { tag: '*|FNAME|*', label: 'First name', description: 'FNAME' },
    ]);
    mailchimp.fetchInterestCategories?.mockRejectedValue(new Error('scope'));

    const response = await gql(
      app,
      `query { newsletterMergeFields { fields { tag name } interests { title } error } }`
    ).expect(200);

    expect(response.body.data.newsletterMergeFields).toEqual({
      fields: [{ tag: '*|FNAME|*', name: 'First name' }],
      interests: [],
      error: 'Interest groups could not be loaded: scope',
    });
  });
});
