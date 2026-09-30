import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { createKvMock, KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import { SecretCrypto } from '@wepublish/settings/api';
import {
  getSeoAnalysisSystemPrompt,
  SeoAnalysisService,
} from './seo-analysis.service';
import {
  AnalyzeSeoContentInput,
  SeoFindingCategory,
  SeoFindingSeverity,
} from './seo-analysis.model';
import { SeoMetadataContentType } from './seo-metadata.model';
import { V0ClientService } from './v0-client.service';

const createChatSpy = jest.fn();

jest.mock('v0-sdk', () => ({
  createClient: jest.fn(() => ({
    chats: {
      create: (...args: unknown[]) => createChatSpy(...args),
    },
  })),
}));

const mockPrisma = {
  settingAIProvider: {
    update: jest.fn(),
    findUnique: jest.fn(),
  },
};

const chatWith = (content: string) => ({
  id: 'chat-id',
  messages: [
    { role: 'user', content: 'prompt' },
    { role: 'assistant', content },
  ],
});

const validAnalysis = {
  summary: 'Der Artikel ist gut strukturiert, der SEO-Titel ist zu allgemein.',
  findings: [
    {
      severity: 'high',
      category: 'title',
      message: 'Der SEO-Titel nennt das Hauptthema nicht.',
      suggestion: 'Nennen Sie das Velokonzept am Anfang des Titels.',
    },
    {
      severity: 'low',
      category: 'images',
      message: 'Ein Bild hat keine Beschreibung.',
      suggestion: null,
    },
  ],
};

const input: AnalyzeSeoContentInput = {
  type: SeoMetadataContentType.Article,
  title: 'Velokonzept verabschiedet',
  lead: 'Der Stadtrat sagt Ja.',
  body: 'Der Stadtrat hat am Dienstag ein neues Velokonzept verabschiedet.',
  seoTitle: 'News',
  locale: 'de',
  stats: {
    wordCount: 10,
    headingCount: 0,
    linkCount: 0,
    imageCount: 1,
    imagesWithoutDescription: 1,
    hasShareImage: false,
  },
};

describe('SeoAnalysisService', () => {
  let service: SeoAnalysisService;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockPrisma.settingAIProvider.findUnique.mockResolvedValue({
      apiKey: new SecretCrypto().encrypt('secret-key'),
      systemPrompt: 'Generate HTML',
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeoAnalysisService,
        V0ClientService,
        { provide: PrismaClient, useValue: mockPrisma },
        { provide: KvTtlCacheService, useValue: createKvMock() },
      ],
    }).compile();

    service = module.get(SeoAnalysisService);
  });

  test('returns validated findings', async () => {
    createChatSpy.mockResolvedValue(
      chatWith(`\`\`\`json\n${JSON.stringify(validAnalysis)}\n\`\`\``)
    );

    await expect(service.analyze(input)).resolves.toEqual({
      summary: validAnalysis.summary,
      findings: [
        {
          severity: SeoFindingSeverity.High,
          category: SeoFindingCategory.Title,
          message: validAnalysis.findings[0].message,
          suggestion: validAnalysis.findings[0].suggestion,
        },
        {
          severity: SeoFindingSeverity.Low,
          category: SeoFindingCategory.Images,
          message: validAnalysis.findings[1].message,
          suggestion: undefined,
        },
      ],
    });
  });

  test('accepts an analysis without findings', async () => {
    createChatSpy.mockResolvedValue(
      chatWith(JSON.stringify({ summary: 'Alles gut.', findings: [] }))
    );

    await expect(service.analyze(input)).resolves.toEqual({
      summary: 'Alles gut.',
      findings: [],
    });
  });

  test('sends content, metadata and stats but not the html system prompt', async () => {
    createChatSpy.mockResolvedValue(chatWith(JSON.stringify(validAnalysis)));

    await service.analyze(input);

    const [{ system, message }] = createChatSpy.mock.calls[0];

    expect(system).toBe(getSeoAnalysisSystemPrompt('de'));
    expect(system).not.toContain('Generate HTML');
    expect(message).toContain('"seoTitle":"News"');
    expect(message).toContain('"imagesWithoutDescription":1');
    expect(message).toContain(input.body);
  });

  test('writes findings in the requested language', () => {
    expect(getSeoAnalysisSystemPrompt('de')).toContain('in German');
    expect(getSeoAnalysisSystemPrompt('fr-CH')).toContain('in French');
    expect(getSeoAnalysisSystemPrompt('xx')).toContain('in English');
  });

  test('rejects malformed json', async () => {
    createChatSpy.mockResolvedValue(chatWith('```json\n{"summary": \n```'));

    await expect(service.analyze(input)).rejects.toThrow(
      new BadRequestException('Invalid SEO analysis returned by AI')
    );
  });

  test('rejects unknown severities and categories', async () => {
    createChatSpy.mockResolvedValue(
      chatWith(
        JSON.stringify({
          summary: 'x',
          findings: [
            { severity: 'critical', category: 'keywords', message: 'x' },
          ],
        })
      )
    );

    await expect(service.analyze(input)).rejects.toBeInstanceOf(
      BadRequestException
    );
  });

  test('rejects too many findings', async () => {
    createChatSpy.mockResolvedValue(
      chatWith(
        JSON.stringify({
          summary: 'x',
          findings: Array.from({ length: 13 }, () => validAnalysis.findings[0]),
        })
      )
    );

    await expect(service.analyze(input)).rejects.toBeInstanceOf(
      BadRequestException
    );
  });

  test('does not call the AI without content', async () => {
    await expect(
      service.analyze({ ...input, title: ' ', body: '' })
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(createChatSpy).not.toHaveBeenCalled();
  });
});
