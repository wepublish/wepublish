import { MailChannel } from '@prisma/client';
import type { Mock } from 'vitest';
import { LetterSender } from './letter-sender';
import { resolveLetterRecipient } from './resolve-letter-recipient';

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

const user = {
  id: 'user-1',
  email: 'jane@example.com',
  firstName: 'Jane',
  name: 'Doe',
} as any;

function setup({
  preference = { channel: MailChannel.letter },
  configured = true,
  canReceive = true,
}: {
  preference?: { channel: MailChannel } | null;
  configured?: boolean;
  canReceive?: boolean;
} = {}) {
  const letterSender: { [K in keyof LetterSender]: Mock } = {
    isConfigured: vi.fn(async () => configured),
    canReceiveLetters: vi.fn(() => canReceive),
    sendLetter: vi.fn(),
  };

  const prisma = {
    user: { findUnique: vi.fn(async () => ({ ...user, address })) },
    userDeliveryPreference: { findUnique: vi.fn(async () => preference) },
  };

  const resolve = (
    overrides: Partial<Parameters<typeof resolveLetterRecipient>[0]> = {}
  ) =>
    resolveLetterRecipient({
      prisma: prisma as any,
      letterSender,
      recipient: user,
      asLetter: true,
      ...overrides,
    });

  return { resolve, letterSender, prisma };
}

describe('resolveLetterRecipient', () => {
  it('is the user with their address when everything points to paper', async () => {
    const { resolve, letterSender } = setup();

    await expect(resolve()).resolves.toEqual(
      expect.objectContaining({ id: 'user-1', address })
    );
    expect(letterSender.canReceiveLetters).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'user-1' }),
      { withPaymentSlip: false }
    );
  });

  it('asks whether the address takes a payment slip when the letter carries one', async () => {
    const { resolve, letterSender } = setup({ canReceive: false });

    await expect(resolve({ withPaymentSlip: true })).resolves.toBeNull();
    expect(letterSender.canReceiveLetters).toHaveBeenCalledWith(
      expect.anything(),
      { withPaymentSlip: true }
    );
  });

  it('is nobody for an event that is not switched to letters', async () => {
    const { resolve, prisma } = setup();

    await expect(resolve({ asLetter: false })).resolves.toBeNull();
    expect(prisma.userDeliveryPreference.findUnique).not.toHaveBeenCalled();
  });

  it('is nobody without a letter sender', async () => {
    const { resolve } = setup();

    await expect(resolve({ letterSender: undefined })).resolves.toBeNull();
  });

  it('is nobody for a user who prefers mail', async () => {
    const { resolve } = setup({ preference: { channel: MailChannel.mail } });

    await expect(resolve()).resolves.toBeNull();
  });

  it('is nobody while no letter integration is configured', async () => {
    const { resolve } = setup({ configured: false });

    await expect(resolve()).resolves.toBeNull();
  });
});
