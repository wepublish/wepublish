import { MailChannel } from '@prisma/client';
import {
  findTemplateVariant,
  requireTemplateVariant,
} from './template-variant';

const mailVariant = {
  id: 'variant-1',
  templateId: 'template-1',
  channel: MailChannel.mail,
  subject: 'Hello',
  htmlContent: '<p>Hello</p>',
  textContent: null,
};

function setup(variant: typeof mailVariant | null = mailVariant) {
  const prisma = {
    mailTemplateVariant: { findUnique: vi.fn(async () => variant) },
  };

  return {
    prisma: prisma as any,
    findUnique: prisma.mailTemplateVariant.findUnique,
  };
}

describe('findTemplateVariant', () => {
  it('reads what the template says on the channel', async () => {
    const { prisma, findUnique } = setup();

    await expect(
      findTemplateVariant(prisma, 'template-1', MailChannel.mail)
    ).resolves.toEqual(mailVariant);
    expect(findUnique).toHaveBeenCalledWith({
      where: {
        templateId_channel: {
          templateId: 'template-1',
          channel: MailChannel.mail,
        },
      },
    });
  });

  it('is nothing for a channel the template was not written for', async () => {
    const { prisma } = setup(null);

    await expect(
      findTemplateVariant(prisma, 'template-1', MailChannel.letter)
    ).resolves.toBeNull();
  });
});

describe('requireTemplateVariant', () => {
  it('is the variant when there is one', async () => {
    const { prisma } = setup();

    await expect(
      requireTemplateVariant(prisma, 'template-1', MailChannel.mail)
    ).resolves.toEqual(mailVariant);
  });

  it('names the template and the channel when there is none', async () => {
    const { prisma } = setup(null);

    await expect(
      requireTemplateVariant(prisma, 'template-1', MailChannel.letter)
    ).rejects.toThrow('MailTemplate <template-1> has no letter version!');
  });
});
