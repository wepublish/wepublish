import { MailChannel, MailLogState, MailLogType } from '@prisma/client';
import type { Mock } from 'vitest';
import { LetterDeliveryError, LetterSender } from './letter-sender';
import { MailContext } from './mail-context';
import {
  MailController,
  MailControllerConfig,
  mailLogType,
} from './mail.controller';

const runDate = new Date('2026-10-16T02:00:00.000Z');

const address = {
  company: null,
  streetAddress: 'Musterstrasse',
  streetAddressNumber: '7',
  streetAddress2: null,
  streetAddress2Number: null,
  zipCode: '8000',
  city: 'Zürich',
  country: 'CH',
};

const user = () =>
  ({
    id: 'user-1',
    email: 'jane@example.com',
    firstName: 'Jane',
    name: 'Doe',
    password: 'secret',
  }) as any;

const config = (
  overrides: Partial<MailControllerConfig> = {}
): MailControllerConfig => ({
  mailTemplateId: 'template-1',
  recipient: user(),
  optionalData: { invoice: { id: 'inv-1' } },
  mailType: mailLogType.SubscriptionFlow,
  periodicJobRunDate: runDate,
  daysAwayFromEnding: 3,
  mailSendJobId: null,
  asLetter: true,
  ...overrides,
});

const expectedIdentifier = `${mailLogType.SubscriptionFlow}-${runDate.toISOString()}-3-template-1-user-1`;

function setup({
  preference = { channel: MailChannel.letter },
  configured = true,
  hasAddress = true,
  placeholder = false,
}: {
  preference?: { channel: MailChannel } | null;
  configured?: boolean;
  hasAddress?: boolean;
  placeholder?: boolean;
} = {}) {
  const letterSender: { [K in keyof LetterSender]: Mock } = {
    isConfigured: vi.fn(async () => configured),
    canReceiveLetters: vi.fn(() => hasAddress),
    sendLetter: vi.fn(async () => 'log-1'),
  };

  const prisma = {
    mailLog: { count: vi.fn(async () => 0), create: vi.fn() },
    mailTemplate: {
      findUnique: vi.fn(async () => ({
        subject: 'S',
        htmlContent: '<p>x</p>',
        textContent: null,
      })),
    },
    user: {
      findUnique: vi.fn(async () => ({
        ...user(),
        address: hasAddress ? address : null,
      })),
    },
    userDeliveryPreference: { findUnique: vi.fn(async () => preference) },
  };

  const mailContext = {
    mailProvider: { id: 'mailgun' },
    isPlaceholderEmail: vi.fn(async () => placeholder),
    buildMailData: vi.fn(async () => ({
      user: { id: 'user-1' },
      optional: { invoice: { id: 'inv-1' } },
      jwt: 'jwt-1',
      purlCode: 'ABCDE-12345',
    })),
    sendComposedMail: vi.fn(async () => ({
      subject: 'S',
      providerMessageID: 'msg-1',
    })),
    letterSender,
  } as unknown as MailContext;

  const send = (overrides?: Partial<MailControllerConfig>) =>
    new MailController(
      prisma as any,
      mailContext,
      config(overrides)
    ).sendMail();

  return { send, prisma, mailContext, letterSender };
}

describe('MailController letter mode', () => {
  it('prints the mail as a letter for a user in letter mode', async () => {
    const { send, letterSender, mailContext, prisma } = setup();

    await send();

    expect(letterSender.sendLetter).toHaveBeenCalledWith({
      mailTemplateId: 'template-1',
      recipient: expect.objectContaining({ id: 'user-1', address }),
      data: expect.objectContaining({ purlCode: 'ABCDE-12345' }),
      mailLogId: expect.any(String),
      mailSendJobId: null,
      log: {
        mailIdentifier: expectedIdentifier,
        type: MailLogType.subscriptionFlow,
      },
    });
    // The letter side writes its own log entry.
    expect(mailContext.sendComposedMail).not.toHaveBeenCalled();
    expect(prisma.mailLog.create).not.toHaveBeenCalled();
  });

  it('builds the letter data for the letter, with its login code', async () => {
    const { send, mailContext } = setup();

    await send();

    expect(mailContext.buildMailData).toHaveBeenCalledWith(
      expect.objectContaining({ purlOrigin: 'letter', mode: 'send' })
    );
  });

  // A placeholder address is exactly who a letter is for: it must reach the
  // letter branch instead of the placeholder suppression.
  it('prints for a placeholder address in letter mode', async () => {
    const { send, letterSender, prisma } = setup({ placeholder: true });

    await send();

    expect(letterSender.sendLetter).toHaveBeenCalledTimes(1);
    expect(prisma.mailLog.create).not.toHaveBeenCalled();
  });

  it('records a placeholder address without a usable postal address', async () => {
    const { send, letterSender, mailContext, prisma } = setup({
      placeholder: true,
      hasAddress: false,
    });

    await send();

    expect(letterSender.sendLetter).not.toHaveBeenCalled();
    expect(mailContext.sendComposedMail).not.toHaveBeenCalled();
    expect(prisma.mailLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        channel: MailChannel.letter,
        state: MailLogState.rejected,
        error: 'LETTER_ADDRESS_UNUSABLE',
        mailIdentifier: expectedIdentifier,
      }),
    });
  });

  it('keeps mailing an event that is not switched to letters', async () => {
    const { send, letterSender, mailContext, prisma } = setup();

    await send({ asLetter: false });

    expect(prisma.userDeliveryPreference.findUnique).not.toHaveBeenCalled();
    expect(letterSender.sendLetter).not.toHaveBeenCalled();
    expect(mailContext.sendComposedMail).toHaveBeenCalled();
  });

  it('keeps mailing a user without a letter preference', async () => {
    const { send, letterSender, mailContext } = setup({ preference: null });

    await send();

    expect(letterSender.sendLetter).not.toHaveBeenCalled();
    expect(mailContext.sendComposedMail).toHaveBeenCalled();
  });

  it('keeps mailing a user who prefers mail', async () => {
    const { send, letterSender, mailContext } = setup({
      preference: { channel: MailChannel.mail },
    });

    await send();

    expect(letterSender.sendLetter).not.toHaveBeenCalled();
    expect(mailContext.sendComposedMail).toHaveBeenCalled();
  });

  it('falls back to mail while no letter integration is configured', async () => {
    const { send, letterSender, mailContext } = setup({ configured: false });

    await send();

    expect(letterSender.sendLetter).not.toHaveBeenCalled();
    expect(mailContext.sendComposedMail).toHaveBeenCalled();
  });

  it('falls back to mail when the address is unusable', async () => {
    const { send, letterSender, mailContext } = setup({ hasAddress: false });

    await send();

    expect(letterSender.sendLetter).not.toHaveBeenCalled();
    expect(mailContext.sendComposedMail).toHaveBeenCalled();
  });

  it('reports a failed letter as such and writes no second log entry', async () => {
    const { send, letterSender, prisma } = setup();
    letterSender.sendLetter.mockRejectedValue(new Error('vendor down'));

    await expect(send()).rejects.toThrow(LetterDeliveryError);
    expect(prisma.mailLog.create).not.toHaveBeenCalled();
  });

  it('skips a letter already sent in an earlier run', async () => {
    const { send, letterSender, mailContext, prisma } = setup();
    prisma.mailLog.count.mockResolvedValue(1);

    await send({ isRetry: true });

    expect(letterSender.sendLetter).not.toHaveBeenCalled();
    expect(mailContext.sendComposedMail).not.toHaveBeenCalled();
  });

  it('mails as before when no letter sender is wired', async () => {
    const { send, mailContext, prisma } = setup();
    (mailContext as any).letterSender = undefined;

    await send();

    expect(prisma.userDeliveryPreference.findUnique).not.toHaveBeenCalled();
    expect(mailContext.sendComposedMail).toHaveBeenCalled();
  });
});
