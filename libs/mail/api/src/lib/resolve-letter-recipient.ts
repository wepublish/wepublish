import { Logger } from '@nestjs/common';
import { MailChannel, PrismaClient, User } from '@prisma/client';
import { LetterRecipient, LetterSender } from './letter-sender';

export interface ResolveLetterRecipientProps {
  prisma: PrismaClient;
  /** Absent without letters: everything goes out as mail. */
  letterSender?: LetterSender;
  recipient: User;
  /** The event is switched to letters. */
  asLetter?: boolean;
  /** The letter will carry a payment slip, which needs a Swiss address. */
  withPaymentSlip?: boolean;
  logger?: Logger;
}

/**
 * The user with their address when a send goes to paper: the event is
 * switched to letters, the user prefers them, letters can be printed and the
 * address is usable. Anything missing means the mail goes out as usual.
 */
export async function resolveLetterRecipient({
  prisma,
  letterSender,
  recipient,
  asLetter,
  withPaymentSlip = false,
  logger,
}: ResolveLetterRecipientProps): Promise<LetterRecipient | null> {
  if (!asLetter || !letterSender) {
    return null;
  }

  const preference = await prisma.userDeliveryPreference.findUnique({
    where: { userId: recipient.id },
  });

  if (preference?.channel !== MailChannel.letter) {
    return null;
  }

  if (!(await letterSender.isConfigured())) {
    logger?.warn(
      `No letter integration is configured; mailing <${recipient.email}> instead.`
    );

    return null;
  }

  // The callers hand in a bare user; the address lives in its own row.
  const user = await prisma.user.findUnique({
    where: { id: recipient.id },
    include: { address: true },
  });

  if (!user || !letterSender.canReceiveLetters(user, { withPaymentSlip })) {
    logger?.warn(
      `<${recipient.email}> prefers letters but has no usable postal address${
        withPaymentSlip ? ' in Switzerland' : ''
      }; mailing instead.`
    );

    return null;
  }

  return user;
}
