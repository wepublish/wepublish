import { AuthSessionType } from '@wepublish/authentication/api';
import { Test, TestingModule } from '@nestjs/testing';
import { MailChannel, MailTemplate, PrismaClient } from '@prisma/client';
import {
  MailContext,
  MailProvider,
  MailTemplateStatus,
} from '@wepublish/mail/api';
import { MailTemplatesResolver } from './mail-template.resolver';
import { MailTemplateService } from './mail-template.service';
import { UsedMailTemplateDataloader } from './used-mail-template.dataloader';
import {
  MailTemplateLetterDetailDataloader,
  MailTemplateVariantDataloader,
  MailTemplateVariantSummaryDataloader,
} from './mail-template-variant.dataloader';
import { MailTemplateMemberPlanDataloader } from './mail-template-member-plan.dataloader';
import { MailTemplateAttachmentNameDataloader } from './mail-template-attachment-name.dataloader';
import { INestApplication, Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriverConfig } from '@nestjs/apollo';
import { NodeAdapter } from '@nestjs/platform-node';
import { NodeApolloDriver } from '@wepublish/utils/api';
import { PrismaModule } from '@wepublish/nest-modules';
import { APP_GUARD } from '@nestjs/core';
import { FeaturesService } from '@wepublish/features/api';
import { PermissionsGuard } from '@wepublish/permissions/api';
import request from 'supertest';
import {
  registerMailsModule,
  registerPaymentMethodModule,
} from '../testing/module-registrars';
import { PaymentsModule } from '@wepublish/payment/api';
import { NamespacedCacheTestingModule } from '@wepublish/kv-ttl-cache/api/testing';

const mailTemplatesQuery = `
  query MailTemplates {
    mailTemplates {
      id
    }
  }
`;
const providerQuery = `
  query Provider {
    provider {
      name
    }
  }
`;
const createTemplateMutation = `
  mutation Mutation($input: MailTemplateInput!) {
    createMailTemplate(input: $input) {
      id
    }
  }
`;

const mockTemplate1: MailTemplate = {
  id: '8056eda4-9013-42eb-b584-55a4f450eaf3',
  name: 'Mock Template 1',
  description: 'Mock Desc 1',
  subject: 'Subject 1',
  htmlContent: '<p>Content 1</p>',
  textContent: null,
  externalMailTemplateId: null,
  context: null,
  createdAt: new Date(),
  modifiedAt: new Date(),
};

const mockTemplate2: MailTemplate = {
  id: '400764ac-babf-4662-bc6b-225260ac7f70',
  name: 'Mock Template 2',
  description: 'Mock Desc 2',
  subject: 'Subject 2',
  htmlContent: '<p>Content 2</p>',
  textContent: null,
  externalMailTemplateId: null,
  context: null,
  createdAt: new Date(),
  modifiedAt: new Date(),
};

const mailVariant1 = {
  id: 'variant-1-mail',
  templateId: mockTemplate1.id,
  channel: MailChannel.mail,
  subject: 'Subject 1',
  htmlContent: '<p>Content 1</p>',
  textContent: 'Content 1',
  letterLayoutId: null,
  letterAppendixId: null,
};

const letterVariant1 = {
  id: 'variant-1-letter',
  templateId: mockTemplate1.id,
  channel: MailChannel.letter,
  subject: 'Brief 1',
  htmlContent: '<p>Brief 1</p>',
  textContent: null,
  letterLayoutId: 'layout-1',
  letterAppendixId: 'doc-1',
};

// Template 2 is written as a letter only.
const letterVariant2 = {
  id: 'variant-2-letter',
  templateId: mockTemplate2.id,
  channel: MailChannel.letter,
  subject: 'Brief 2',
  htmlContent: '<p>Brief 2</p>',
  textContent: null,
  letterLayoutId: null,
  letterAppendixId: null,
};

// What the letter of each template is printed on, as the list asks for it.
const letterDetails = [
  {
    templateId: mockTemplate1.id,
    letterLayout: { name: 'Briefpapier Verlag' },
    letterAppendix: { title: null, filename: 'qr-rechnung' },
  },
  { templateId: mockTemplate2.id, letterLayout: null, letterAppendix: null },
];

const attachmentsInOrder = {
  attachments: { select: { documentId: true }, orderBy: { position: 'asc' } },
};

const prismaServiceMock = {
  mailTemplateVariant: {
    findMany: vi.fn(async (args?: any): Promise<any[]> =>
      args?.select?.letterLayout ?
        letterDetails
      : [mailVariant1, letterVariant1, letterVariant2]
    ),
  },
  mailTemplateAttachment: {
    // In the order the template lists them, whatever their names are.
    findMany: vi.fn(async (_args?: any) => [
      {
        mailTemplateId: mockTemplate1.id,
        document: { title: 'Zahlschein', filename: 'zahlschein' },
      },
      {
        mailTemplateId: mockTemplate1.id,
        document: { title: null, filename: 'agb' },
      },
    ]),
  },
  subscriptionInterval: {
    findMany: vi.fn(async (_args?: any) => [
      {
        mailTemplateId: mockTemplate1.id,
        subscriptionFlow: { memberPlan: { id: 'plan-b', name: 'Print' } },
      },
      {
        mailTemplateId: mockTemplate1.id,
        subscriptionFlow: { memberPlan: { id: 'plan-a', name: 'Digital' } },
      },
      // Two events of the same plan, and the default flow, which has no plan.
      {
        mailTemplateId: mockTemplate1.id,
        subscriptionFlow: { memberPlan: { id: 'plan-a', name: 'Digital' } },
      },
      {
        mailTemplateId: mockTemplate1.id,
        subscriptionFlow: { memberPlan: null },
      },
    ]),
  },
  mailTemplate: {
    findMany: vi.fn((): MailTemplate[] => [mockTemplate1, mockTemplate2]),
    findUnique: vi.fn(async () => mockTemplate1),
    create: vi.fn(async () => mockTemplate1),
    update: vi.fn(async () => mockTemplate1),
    delete: vi.fn(async () => mockTemplate1),
  },
};

const letterPreviewQuery = `
  query MailTemplateLetterPreview($input: MailTemplatePreviewInput!) {
    mailTemplateLetterPreview(input: $input) {
      pdf
    }
  }
`;

const letterChannelAvailableQuery = `
  query LetterChannelAvailable {
    letterChannelAvailable
  }
`;

const mailProviderServiceMock = {
  getName: vi.fn(async () => 'MockProvider'),
};

const mailContextMock = {
  mailProvider: mailProviderServiceMock as unknown as MailProvider,
  getUsedTemplateIdentifiers: vi.fn((): string[] => [mockTemplate2.id]),
};

// Paper letters ship dark; the guard asks this before every letter operation.
const featuresMock = {
  isEnabled: vi.fn(async () => true),
};

const mailTemplateServiceMock = {
  createMailTemplate: vi.fn(async () => mockTemplate1),
  updateMailTemplate: vi.fn(async () => mockTemplate1),
  deleteMailTemplateVariant: vi.fn(async () => undefined),
  deleteMailTemplate: vi.fn(async () => undefined),
  preview: vi.fn(async () => ({ subject: 's', html: 'h', text: undefined })),
  sendTest: vi.fn(async () => undefined),
  previewLetter: vi.fn(async () => ({ pdf: 'cGRm' })),
  isLetterChannelAvailable: vi.fn(async () => true),
};

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: NodeApolloDriver,
      autoSchemaFile: true,
      path: '/',
    }),
    PrismaModule,
    NamespacedCacheTestingModule.forRoot(),
    registerMailsModule(),
    registerPaymentMethodModule(),
    PaymentsModule,
  ],
  providers: [
    MailTemplatesResolver,
    UsedMailTemplateDataloader,
    MailTemplateVariantDataloader,
    MailTemplateVariantSummaryDataloader,
    MailTemplateLetterDetailDataloader,
    MailTemplateAttachmentNameDataloader,
    MailTemplateMemberPlanDataloader,
    { provide: MailTemplateService, useValue: mailTemplateServiceMock },
    { provide: FeaturesService, useValue: featuresMock },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
})
export class AppModule {}

describe('MailTemplatesResolver', () => {
  let resolver: MailTemplatesResolver;
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication(new NodeAdapter());
    await app.listen(0, '127.0.0.1');
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailTemplatesResolver,
        UsedMailTemplateDataloader,
        MailTemplateVariantDataloader,
        MailTemplateVariantSummaryDataloader,
        MailTemplateLetterDetailDataloader,
        MailTemplateAttachmentNameDataloader,
        MailTemplateMemberPlanDataloader,
        { provide: PrismaClient, useValue: prismaServiceMock },
        { provide: MailContext, useValue: mailContextMock },
        { provide: MailTemplateService, useValue: mailTemplateServiceMock },
        { provide: FeaturesService, useValue: featuresMock },
      ],
    }).compile();

    // The resolver depends on a REQUEST-scoped dataloader, so it must be
    // resolved rather than fetched from the singleton container.
    resolver = await module.resolve<MailTemplatesResolver>(
      MailTemplatesResolver
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('is defined', () => {
    expect(resolver).toBeDefined();
  });

  it('returns all templates', async () => {
    const result = await resolver.mailTemplates();
    expect(result.length).toEqual(2);
    expect(result[0].name).toEqual('Mock Template 1');
    expect(result[1].name).toEqual('Mock Template 2');
  });

  // One join instead of one lookup per template for `attachmentIds`.
  it('returns the templates with the ids of their attachments', async () => {
    await resolver.mailTemplates();

    expect(prismaServiceMock.mailTemplate.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ include: attachmentsInOrder })
    );
  });

  it('resolves the attachment ids of a template in their order', async () => {
    expect(
      await resolver.attachmentIds({
        ...mockTemplate1,
        attachments: [{ documentId: 'terms' }, { documentId: 'contract' }],
      } as any)
    ).toEqual(['terms', 'contract']);
  });

  it('looks the attachments up for a template loaded without them', async () => {
    prismaServiceMock.mailTemplate.findUnique.mockResolvedValueOnce({
      ...mockTemplate1,
      attachments: [{ documentId: 'contract' }],
    } as any);

    expect(await resolver.attachmentIds(mockTemplate1 as any)).toEqual([
      'contract',
    ]);
  });

  // The list query deliberately omits htmlContent/textContent, so the edit view
  // needs a way to load one template's body on its own.
  it('returns a single template by id', async () => {
    const result = await resolver.mailTemplate(mockTemplate1.id);

    expect(prismaServiceMock.mailTemplate.findUnique).toHaveBeenCalledWith({
      where: { id: mockTemplate1.id },
      include: attachmentsInOrder,
    });
    expect(result?.id).toEqual(mockTemplate1.id);
  });

  describe('what the template table shows', () => {
    beforeEach(() => {
      prismaServiceMock.mailTemplateVariant.findMany.mockClear();
      prismaServiceMock.subscriptionInterval.findMany.mockClear();
    });

    it('names the stationery and the appendix of the letter version', async () => {
      await expect(
        resolver.letterLayoutName(mockTemplate1 as any)
      ).resolves.toBe('Briefpapier Verlag');
      await expect(
        resolver.letterAppendixName(mockTemplate1 as any)
      ).resolves.toBe('qr-rechnung');
    });

    it('leaves both empty for a letter on the default stationery without appendix', async () => {
      await expect(
        resolver.letterLayoutName(mockTemplate2 as any)
      ).resolves.toBeNull();
      await expect(
        resolver.letterAppendixName(mockTemplate2 as any)
      ).resolves.toBeNull();
    });

    it('reads the letter details of many templates in one query', async () => {
      await Promise.all([
        resolver.letterLayoutName(mockTemplate1 as any),
        resolver.letterAppendixName(mockTemplate1 as any),
        resolver.letterLayoutName(mockTemplate2 as any),
      ]);

      expect(
        prismaServiceMock.mailTemplateVariant.findMany
      ).toHaveBeenCalledTimes(1);
      expect(
        prismaServiceMock.mailTemplateVariant.findMany
      ).toHaveBeenCalledWith({
        where: {
          templateId: { in: [mockTemplate1.id, mockTemplate2.id] },
          channel: MailChannel.letter,
        },
        select: {
          templateId: true,
          letterLayout: { select: { name: true } },
          letterAppendix: { select: { title: true, filename: true } },
        },
      });
    });

    it('lists each member plan whose flow sends the template once, by name', async () => {
      await expect(resolver.memberPlans(mockTemplate1 as any)).resolves.toEqual(
        [
          { id: 'plan-a', name: 'Digital' },
          { id: 'plan-b', name: 'Print' },
        ]
      );
      await expect(resolver.memberPlans(mockTemplate2 as any)).resolves.toEqual(
        []
      );
    });

    it('names the attachments of a template in their order', async () => {
      await expect(
        resolver.attachmentNames(mockTemplate1 as any)
      ).resolves.toEqual(['Zahlschein', 'agb']);
      await expect(
        resolver.attachmentNames(mockTemplate2 as any)
      ).resolves.toEqual([]);
    });

    it('reads the attachment names of many templates in one query', async () => {
      prismaServiceMock.mailTemplateAttachment.findMany.mockClear();

      await Promise.all([
        resolver.attachmentNames(mockTemplate1 as any),
        resolver.attachmentNames(mockTemplate2 as any),
      ]);

      expect(
        prismaServiceMock.mailTemplateAttachment.findMany
      ).toHaveBeenCalledTimes(1);
      expect(
        prismaServiceMock.mailTemplateAttachment.findMany
      ).toHaveBeenCalledWith({
        where: { mailTemplateId: { in: [mockTemplate1.id, mockTemplate2.id] } },
        orderBy: { position: 'asc' },
        select: {
          mailTemplateId: true,
          document: { select: { title: true, filename: true } },
        },
      });
    });

    it('reads the member plans of many templates in one query', async () => {
      await Promise.all([
        resolver.memberPlans(mockTemplate1 as any),
        resolver.memberPlans(mockTemplate2 as any),
      ]);

      expect(
        prismaServiceMock.subscriptionInterval.findMany
      ).toHaveBeenCalledTimes(1);
    });
  });

  describe('what a template says per channel', () => {
    beforeEach(() =>
      prismaServiceMock.mailTemplateVariant.findMany.mockClear()
    );

    it('lists the channels a template is written for', async () => {
      await expect(resolver.channels(mockTemplate1 as any)).resolves.toEqual([
        MailChannel.mail,
        MailChannel.letter,
      ]);
      await expect(resolver.channels(mockTemplate2 as any)).resolves.toEqual([
        MailChannel.letter,
      ]);
    });

    it('shows the email subject, or the letter title of a letter-only template', async () => {
      await expect(resolver.subject(mockTemplate1 as any)).resolves.toBe(
        'Subject 1'
      );
      await expect(resolver.subject(mockTemplate2 as any)).resolves.toBe(
        'Brief 2'
      );
    });

    // A list of templates asks for channels and subject per row: the bodies
    // are whole emails and stay in the database, and it is one query.
    it('reads channels and subjects of many templates at once, without the bodies', async () => {
      await Promise.all([
        resolver.channels(mockTemplate1 as any),
        resolver.subject(mockTemplate1 as any),
        resolver.channels(mockTemplate2 as any),
        resolver.subject(mockTemplate2 as any),
      ]);

      expect(
        prismaServiceMock.mailTemplateVariant.findMany
      ).toHaveBeenCalledTimes(1);
      expect(
        prismaServiceMock.mailTemplateVariant.findMany
      ).toHaveBeenCalledWith({
        where: { templateId: { in: [mockTemplate1.id, mockTemplate2.id] } },
        select: { templateId: true, channel: true, subject: true },
      });
    });

    it('hands the edit view every version, the email first', async () => {
      await expect(resolver.variants(mockTemplate1 as any)).resolves.toEqual([
        mailVariant1,
        letterVariant1,
      ]);
    });

    it('keeps answering the fields a template had before it got versions', async () => {
      await expect(resolver.htmlContent(mockTemplate1 as any)).resolves.toBe(
        '<p>Content 1</p>'
      );
      await expect(resolver.textContent(mockTemplate1 as any)).resolves.toBe(
        'Content 1'
      );
      await expect(resolver.letterLayoutId(mockTemplate1 as any)).resolves.toBe(
        'layout-1'
      );
      await expect(
        resolver.letterAppendixId(mockTemplate1 as any)
      ).resolves.toBe('doc-1');
      // No email version: nothing to show, but the field stays non-null.
      await expect(resolver.htmlContent(mockTemplate2 as any)).resolves.toBe(
        ''
      );
    });
  });

  it('resolves the provider', async () => {
    const result = await resolver.provider();
    expect(await (result as any).name).toBe('MockProvider');
  });

  // The service stores the attachments and checks them.
  it('creates a mail template via the service', async () => {
    const input = {
      name: 'New',
      variants: [
        { channel: MailChannel.mail, subject: 'Hi', htmlContent: '<p>Hi</p>' },
      ],
      attachmentIds: ['contract'],
    };

    await resolver.createMailTemplate(input);

    expect(mailTemplateServiceMock.createMailTemplate).toHaveBeenCalledWith(
      input
    );
  });

  it('updates a mail template via the service', async () => {
    const input = {
      name: 'Changed',
      variants: [],
      attachmentIds: ['contract'],
    };

    await resolver.updateMailTemplate(mockTemplate1.id, input);

    expect(mailTemplateServiceMock.updateMailTemplate).toHaveBeenCalledWith(
      mockTemplate1.id,
      input
    );
  });

  it('removes one version of a template via the service', async () => {
    await resolver.deleteMailTemplateVariant(
      mockTemplate1.id,
      MailChannel.letter
    );

    expect(
      mailTemplateServiceMock.deleteMailTemplateVariant
    ).toHaveBeenCalledWith(mockTemplate1.id, MailChannel.letter);
  });

  it('deletes a mail template via the service', async () => {
    await resolver.deleteMailTemplate(mockTemplate1.id);
    expect(mailTemplateServiceMock.deleteMailTemplate).toHaveBeenCalledWith(
      mockTemplate1.id
    );
  });

  it('computes the template status', async () => {
    const [template1, template2] = await resolver.mailTemplates();
    expect(await resolver.status(template1 as any)).toEqual(
      MailTemplateStatus.Unused
    );
    expect(await resolver.status(template2 as any)).toEqual(
      MailTemplateStatus.Ok
    );
  });

  // Regression: `status` is a per-template field resolver. It used to call
  // `getUsedTemplateIdentifiers()` once per template, so a single
  // `mailTemplates` query fanned out to 2N concurrent queries and exhausted
  // the Prisma connection pool — which timed out every other request in the
  // process, not just this one.
  it('resolves status for many templates with a single lookup', async () => {
    mailContextMock.getUsedTemplateIdentifiers.mockClear();

    const templates = Array.from({ length: 30 }, (_unused, index) => ({
      ...mockTemplate1,
      id: `template-${index}`,
    }));

    const statuses = await Promise.all(
      templates.map(template => resolver.status(template as any))
    );

    expect(statuses).toHaveLength(30);
    expect(mailContextMock.getUsedTemplateIdentifiers).toHaveBeenCalledTimes(1);
  });

  it('renders a draft as a letter via the service', async () => {
    const result = await resolver.mailTemplateLetterPreview(
      { type: AuthSessionType.User, user: { id: 'editor-1' } } as any,
      {
        contextId: 'renewal',
        subscriptionId: 'sub-1',
        subject: 'ignored',
        htmlContent: '<p>Hi</p>',
      }
    );

    expect(mailTemplateServiceMock.previewLetter).toHaveBeenCalledWith({
      contextId: 'renewal',
      subscriptionId: 'sub-1',
      currentUserId: 'editor-1',
      html: '<p>Hi</p>',
    });
    expect(result).toEqual({ pdf: 'cGRm' });
  });

  it('prints the attachments chosen on the draft in the letter preview', async () => {
    await resolver.mailTemplateLetterPreview(
      { type: AuthSessionType.User, user: { id: 'editor-1' } } as any,
      {
        contextId: 'renewal',
        subject: 'ignored',
        htmlContent: '<p>Hi</p>',
        attachmentIds: ['contract'],
      }
    );

    expect(mailTemplateServiceMock.previewLetter).toHaveBeenCalledWith(
      expect.objectContaining({ attachmentIds: ['contract'] })
    );
  });

  it('attaches the documents chosen on the draft to the test mail', async () => {
    await resolver.sendTestMailTemplate(
      {
        type: AuthSessionType.User,
        user: { id: 'editor-1', email: 'editor@example.com' },
      } as any,
      {
        contextId: 'renewal',
        subject: 'Hi',
        htmlContent: '<p>Hi</p>',
        attachmentIds: ['contract'],
      }
    );

    expect(mailTemplateServiceMock.sendTest).toHaveBeenCalledWith(
      expect.objectContaining({
        recipient: 'editor@example.com',
        attachmentIds: ['contract'],
      })
    );
  });

  it('reports whether the letter channel is available', async () => {
    expect(await resolver.letterChannelAvailable()).toBe(true);
    expect(mailTemplateServiceMock.isLetterChannelAvailable).toHaveBeenCalled();
  });

  /**
   * Test if endpoints are not exposed to public
   */
  it('letterChannelAvailable is not public', () => {
    return request(app.getHttpServer())
      .post('')
      .send({ query: letterChannelAvailableQuery })
      .expect(200)
      .expect(({ body }) => {
        expect(
          !!body.errors.find(
            (error: any) => error.message === 'Forbidden resource'
          )
        ).toEqual(true);
        expect(body.data).toBeNull();
      });
  });

  it('mailTemplateLetterPreview is not public', () => {
    return request(app.getHttpServer())
      .post('')
      .send({
        query: letterPreviewQuery,
        variables: {
          input: { contextId: 'custom', subject: 's', htmlContent: 'h' },
        },
      })
      .expect(200)
      .expect(({ body }) => {
        expect(
          !!body.errors.find(
            (error: any) => error.message === 'Forbidden resource'
          )
        ).toEqual(true);
        expect(body.data).toBeNull();
      });
  });

  it('mailTemplates is not public', () => {
    return request(app.getHttpServer())
      .post('')
      .send({
        query: mailTemplatesQuery,
      })
      .expect(200)
      .expect(({ body }) => {
        expect(
          !!body.errors.find(
            (error: any) => error.message === 'Forbidden resource'
          )
        ).toEqual(true);
        expect(body.data).toBeNull();
      });
  });

  it('provider is not public', () => {
    return request(app.getHttpServer())
      .post('')
      .send({
        query: providerQuery,
      })
      .expect(200)
      .expect(({ body }) => {
        expect(
          !!body.errors.find(
            (error: any) => error.message === 'Forbidden resource'
          )
        ).toEqual(true);
        expect(body.data).toBeNull();
      });
  });

  it('createMailTemplate is not public', () => {
    return request(app.getHttpServer())
      .post('')
      .send({
        query: createTemplateMutation,
        variables: {
          input: { name: 'x', variants: [] },
        },
      })
      .expect(200)
      .expect(({ body }) => {
        expect(
          !!body.errors.find(
            (error: any) => error.message === 'Forbidden resource'
          )
        ).toEqual(true);
        expect(body.data).toBeNull();
      });
  });
});
