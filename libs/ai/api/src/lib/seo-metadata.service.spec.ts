import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { createKvMock, KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import { SecretCrypto } from '@wepublish/settings/api';
import { createClient } from 'v0-sdk';
import {
  extractJson,
  SEO_METADATA_SYSTEM_PROMPT,
  SeoMetadataService,
} from './seo-metadata.service';
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

const chatWith = (content: string, experimental_content?: unknown[][]) => ({
  id: 'chat-id',
  messages: [
    { role: 'user', content: 'prompt' },
    { role: 'assistant', content, experimental_content },
  ],
});

const validSuggestion = {
  seoTitle: 'Stadtrat beschliesst neues Velokonzept',
  seoDescription:
    'Der Stadtrat hat am Dienstag ein neues Velokonzept verabschiedet, das bis 2030 zwanzig Kilometer neue Velowege vorsieht.',
  socialMediaTitle: 'Neues Velokonzept für die Stadt',
  socialMediaDescription: 'Zwanzig Kilometer neue Velowege bis 2030.',
  slug: 'Stadtrat Velokonzept 2030',
};

const input = {
  type: SeoMetadataContentType.Article,
  title: 'Velokonzept verabschiedet',
  lead: 'Der Stadtrat sagt Ja.',
  body: 'Der Stadtrat hat am Dienstag ein neues Velokonzept verabschiedet.',
};

describe('SeoMetadataService', () => {
  let service: SeoMetadataService;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockPrisma.settingAIProvider.findUnique.mockResolvedValue({
      apiKey: new SecretCrypto().encrypt('secret-key'),
      systemPrompt: 'Generate HTML',
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeoMetadataService,
        V0ClientService,
        { provide: PrismaClient, useValue: mockPrisma },
        { provide: KvTtlCacheService, useValue: createKvMock() },
      ],
    }).compile();

    service = module.get(SeoMetadataService);
  });

  test('returns validated suggestions from a fenced json response', async () => {
    createChatSpy.mockResolvedValue(
      chatWith(
        `Here you go:\n\`\`\`json\n${JSON.stringify(validSuggestion)}\n\`\`\``
      )
    );

    await expect(service.generate(input)).resolves.toEqual({
      ...validSuggestion,
      slug: 'stadtrat-velokonzept-2030',
    });
    expect(createClient).toHaveBeenCalledWith({ apiKey: 'secret-key' });
  });

  test('accepts a raw json response', async () => {
    createChatSpy.mockResolvedValue(chatWith(JSON.stringify(validSuggestion)));

    await expect(service.generate(input)).resolves.toMatchObject({
      seoTitle: validSuggestion.seoTitle,
    });
  });

  test('accepts a json codeblock in experimental content', async () => {
    createChatSpy.mockResolvedValue(
      chatWith('', [
        [0, [['Codeblock', { lang: 'json' }, JSON.stringify(validSuggestion)]]],
      ])
    );

    await expect(service.generate(input)).resolves.toMatchObject({
      seoDescription: validSuggestion.seoDescription,
    });
  });

  test('turns null and empty fields into missing suggestions', async () => {
    createChatSpy.mockResolvedValue(
      chatWith(
        JSON.stringify({
          ...validSuggestion,
          socialMediaTitle: null,
          socialMediaDescription: '  ',
        })
      )
    );

    const result = await service.generate(input);

    expect(result.socialMediaTitle).toBeUndefined();
    expect(result.socialMediaDescription).toBeUndefined();
    expect(result.seoTitle).toBe(validSuggestion.seoTitle);
  });

  test('uses its own system prompt and only the given content', async () => {
    createChatSpy.mockResolvedValue(chatWith(JSON.stringify(validSuggestion)));

    await service.generate(input);

    const [{ system, message }] = createChatSpy.mock.calls[0];

    expect(system).toBe(SEO_METADATA_SYSTEM_PROMPT);
    expect(system).not.toContain('Generate HTML');
    expect(message).toContain(JSON.stringify(input));
  });

  test('truncates very long bodies', async () => {
    createChatSpy.mockResolvedValue(chatWith(JSON.stringify(validSuggestion)));

    await service.generate({ ...input, body: 'a'.repeat(20000) });

    const [{ message }] = createChatSpy.mock.calls[0];

    expect(message).not.toContain('a'.repeat(15001));
    expect(message).toContain('a'.repeat(15000));
  });

  test('rejects malformed json', async () => {
    createChatSpy.mockResolvedValue(
      chatWith('```json\n{"seoTitle": "Foo",\n```')
    );

    await expect(service.generate(input)).rejects.toThrow(
      new BadRequestException('Invalid SEO metadata returned by AI')
    );
  });

  test('rejects responses without json', async () => {
    createChatSpy.mockResolvedValue(chatWith('I cannot help with that.'));

    await expect(service.generate(input)).rejects.toBeInstanceOf(
      BadRequestException
    );
  });

  test('rejects fields exceeding the length limits', async () => {
    createChatSpy.mockResolvedValue(
      chatWith(JSON.stringify({ ...validSuggestion, seoTitle: 'x'.repeat(71) }))
    );

    await expect(service.generate(input)).rejects.toBeInstanceOf(
      BadRequestException
    );
  });

  test('rejects fields with the wrong type', async () => {
    createChatSpy.mockResolvedValue(
      chatWith(JSON.stringify({ ...validSuggestion, seoTitle: 42 }))
    );

    await expect(service.generate(input)).rejects.toBeInstanceOf(
      BadRequestException
    );
  });

  test('rejects responses without any suggestion', async () => {
    createChatSpy.mockResolvedValue(
      chatWith(
        JSON.stringify({
          seoTitle: null,
          seoDescription: null,
          socialMediaTitle: null,
          socialMediaDescription: null,
          slug: null,
        })
      )
    );

    await expect(service.generate(input)).rejects.toBeInstanceOf(
      BadRequestException
    );
  });

  test('propagates provider errors', async () => {
    createChatSpy.mockRejectedValue(new Error('rate limited'));

    await expect(service.generate(input)).rejects.toThrow('rate limited');
  });

  test('does not call the AI without content', async () => {
    await expect(
      service.generate({
        type: SeoMetadataContentType.Page,
        title: ' ',
        body: '',
      })
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(createChatSpy).not.toHaveBeenCalled();
  });

  test('fails without an api key', async () => {
    mockPrisma.settingAIProvider.findUnique.mockResolvedValue({
      apiKey: null,
      systemPrompt: null,
    });

    await expect(service.generate(input)).rejects.toThrow(
      'V0 API key required'
    );
    expect(createChatSpy).not.toHaveBeenCalled();
  });
});

describe('extractJson', () => {
  test('prefers the last assistant message', () => {
    expect(
      extractJson({
        messages: [
          { role: 'assistant', content: '{"a": 1}' },
          { role: 'user', content: '{"b": 2}' },
          { role: 'assistant', content: '```json\n{"c": 3}\n```' },
        ],
      } as never)
    ).toEqual({ c: 3 });
  });

  test('ignores user messages', () => {
    expect(
      extractJson({
        messages: [{ role: 'user', content: '{"b": 2}' }],
      } as never)
    ).toBeNull();
  });
});
