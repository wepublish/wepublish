import type { Mock } from 'vitest';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { INestApplication } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { Test } from '@nestjs/testing';
import { ImageDataloaderService } from '@wepublish/image/api';
import type { NewsletterDocument } from '@wepublish/newsletter/email';
import { createMock, PartialMocked } from '@wepublish/testing';
import request from 'supertest';
import { NewsletterCampaignResolver } from './newsletter-campaign.resolver';
import { NewsletterCampaignService } from './newsletter-campaign.service';
import { NewsletterMailchimpService } from './newsletter-mailchimp.service';

const document: NewsletterDocument = {
  preheader: '',
  blocks: [
    { type: 'image', imageId: 'logo', alt: 'Logo' },
    { type: 'panel', title: 'Gewusst?', paragraphs: [], imageId: 'cover' },
  ],
};

const campaign = {
  id: 'campaign-1',
  title: 'Ausgabe 1',
  document,
  blockCount: 2,
  createdAt: new Date('2026-10-01'),
  modifiedAt: new Date('2026-10-02'),
  mailchimpCampaignId: null,
  mailchimpCampaignWebId: null,
};

const image = {
  id: 'logo',
  createdAt: new Date('2026-10-01'),
  modifiedAt: new Date('2026-10-01'),
  filename: 'logo',
  extension: '.png',
  mimeType: 'image/png',
  format: 'png',
  width: 10,
  height: 10,
  fileSize: 1,
  tags: [],
  focalPointX: 0.5,
  focalPointY: 0.5,
};

describe('NewsletterCampaignResolver', () => {
  let app: INestApplication;
  let campaigns: PartialMocked<NewsletterCampaignService>;
  let images: { loadMany: Mock };

  const gql = (query: string, variables?: Record<string, unknown>) =>
    request(app.getHttpServer()).post('/').send({ query, variables });

  beforeAll(async () => {
    campaigns = createMock(NewsletterCampaignService);
    images = { loadMany: vi.fn().mockResolvedValue([image, null]) };

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
        NewsletterCampaignResolver,
        { provide: NewsletterCampaignService, useValue: campaigns },
        {
          provide: NewsletterMailchimpService,
          useValue: createMock(NewsletterMailchimpService),
        },
        { provide: ImageDataloaderService, useValue: images },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(() => app.close());

  it('returns the document as JSON and the images it uses', async () => {
    campaigns.get?.mockResolvedValue(campaign);

    const { body } = await gql(
      `query { newsletterCampaign(id: "campaign-1") { id document blockCount images { id } } }`
    );

    expect(body.errors).toBeUndefined();
    expect(body.data.newsletterCampaign).toEqual({
      id: 'campaign-1',
      document,
      blockCount: 2,
      images: [{ id: 'logo' }],
    });
    expect(images.loadMany).toHaveBeenCalledWith(['logo', 'cover']);
  });

  it('hands the document over as written', async () => {
    campaigns.update?.mockResolvedValue(campaign);

    const { body } = await gql(
      `mutation ($document: JSONObject!) {
        updateNewsletterCampaign(id: "campaign-1", document: $document) { id }
      }`,
      { document }
    );

    expect(body.errors).toBeUndefined();
    expect(campaigns.update).toHaveBeenCalledWith(
      'campaign-1',
      undefined,
      document
    );
  });

  it('answers the preview as html', async () => {
    campaigns.preview?.mockResolvedValue('<html></html>');

    const { body } = await gql(
      `query { newsletterCampaignPreview(id: "campaign-1") }`
    );

    expect(body.data.newsletterCampaignPreview).toBe('<html></html>');
  });
});
