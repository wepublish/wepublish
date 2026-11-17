import { MailChannel, MailTemplateVariant, PrismaClient } from '@prisma/client';

/**
 * What a template says on one channel, or nothing when it was not written for
 * that channel. Every send reads its words through here: a template is only
 * the group, the content is the variant's.
 */
export function findTemplateVariant(
  prisma: PrismaClient,
  mailTemplateId: string,
  channel: MailChannel
): Promise<MailTemplateVariant | null> {
  return prisma.mailTemplateVariant.findUnique({
    where: { templateId_channel: { templateId: mailTemplateId, channel } },
  });
}

/** The variant a send cannot go without. */
export async function requireTemplateVariant(
  prisma: PrismaClient,
  mailTemplateId: string,
  channel: MailChannel
): Promise<MailTemplateVariant> {
  const variant = await findTemplateVariant(prisma, mailTemplateId, channel);

  if (!variant) {
    throw new Error(
      `MailTemplate <${mailTemplateId}> has no ${channel} version!`
    );
  }

  return variant;
}
