import { MailChannel, MailTemplateVariant, PrismaClient } from '@prisma/client';

/**
 * What a template says on one channel, or nothing when it was not written for
 * that channel. Every send reads its words through here: a template is only
 * the group, the content is the variant's.
 */
export async function findTemplateVariant(
  prisma: PrismaClient,
  mailTemplateId: string,
  channel: MailChannel
): Promise<MailTemplateVariant | null> {
  const variant = await prisma.mailTemplateVariant.findUnique({
    where: { templateId_channel: { templateId: mailTemplateId, channel } },
  });

  if (!variant?.sameAsMail) {
    return variant;
  }

  // A letter that says what the email says keeps no words of its own: it
  // carries the email's on its own stationery. Without the email there is
  // nothing to print.
  const mail = await prisma.mailTemplateVariant.findUnique({
    where: {
      templateId_channel: {
        templateId: mailTemplateId,
        channel: MailChannel.mail,
      },
    },
  });

  return (
    mail && {
      ...variant,
      subject: mail.subject,
      htmlContent: mail.htmlContent,
    }
  );
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
