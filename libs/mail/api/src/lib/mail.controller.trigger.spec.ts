import { MailChannel } from '@prisma/client';
import type { Mock } from 'vitest';
import { LetterSender } from './letter-sender';
import { MailContext } from './mail-context';
import { EMPTY_PURL_DATA } from './mail-data';
import {
  MailController,
  MailControllerConfig,
  mailLogType,
} from './mail.controller';

const user = () =>
  ({
    id: 'user-1',
    email: 'jane@example.com',
    firstName: 'Jane',
    name: 'Doe',
  }) as any;

const config = (
  overrides: Partial<MailControllerConfig> = {}
): MailControllerConfig => ({
  mailTemplateId: 'template-1',
  recipient: user(),
  optionalData: {},
  mailType: mailLogType.SubscriptionFlow,
  ...overrides,
});

function setup() {
  const letterSender: { [K in keyof LetterSender]: Mock } = {
    isConfigured: vi.fn(async () => true),
    canReceiveLetters: vi.fn(() => true),
    sendLetter: vi.fn(async () => 'log-1'),
  };

  const prisma = {
    mailTemplate: { findUnique: vi.fn(async () => null) },
    mailLog: { count: vi.fn(async () => 0), create: vi.fn() },
    user: {
      findUnique: vi.fn(async () => ({ ...user(), address: { city: 'Bern' } })),
    },
    userDeliveryPreference: {
      findUnique: vi.fn(async () => ({ channel: MailChannel.letter })),
    },
    mailTemplateVariant: {
      findUnique: vi.fn(async () => ({ id: 'variant-1' })),
    },
  };

  const mailContext = {
    mailProvider: { id: 'mailgun' },
    jwtGenerator: vi.fn(async () => 'jwt-1'),
    purlProvider: { purlFor: vi.fn(async () => EMPTY_PURL_DATA) },
    isPlaceholderEmail: vi.fn(async () => false),
    buildMailData: MailContext.prototype.buildMailData,
    sendComposedMail: vi.fn(async () => ({
      subject: 'S',
      providerMessageID: 'msg-1',
    })),
    letterSender,
  } as unknown as MailContext;

  const controller = (overrides?: Partial<MailControllerConfig>) =>
    new MailController(prisma as any, mailContext, config(overrides));

  return { controller, prisma, letterSender };
}

describe('MailController trigger', () => {
  it('logs the subscription and the invoice a mail is about', async () => {
    const { controller, prisma } = setup();

    await controller({
      subscriptionId: 'sub-1',
      invoiceId: 'inv-1',
    }).sendMail();

    expect(prisma.mailLog.create.mock.calls[0][0].data).toMatchObject({
      subscription: { connect: { id: 'sub-1' } },
      invoice: { connect: { id: 'inv-1' } },
    });
  });

  it('logs no trigger for a mail that has none', async () => {
    const { controller, prisma } = setup();

    await controller().sendMail();

    const { data } = prisma.mailLog.create.mock.calls[0][0];

    expect(data.subscription).toBeUndefined();
    expect(data.invoice).toBeUndefined();
  });

  it('does not read a trigger out of the template data', async () => {
    const { controller, prisma } = setup();

    await controller({
      optionalData: { subscription: { id: 'sub-9' }, invoice: { id: 'inv-9' } },
    }).sendMail();

    const { data } = prisma.mailLog.create.mock.calls[0][0];

    expect(data.subscription).toBeUndefined();
    expect(data.invoice).toBeUndefined();
  });

  it('hands the trigger to the letter side, which writes the log', async () => {
    const { controller, letterSender } = setup();

    await controller({
      asLetter: true,
      subscriptionId: 'sub-1',
      invoiceId: 'inv-1',
    }).sendMail();

    expect(letterSender.sendLetter.mock.calls[0][0].log).toMatchObject({
      subscriptionId: 'sub-1',
      invoiceId: 'inv-1',
    });
  });
});
