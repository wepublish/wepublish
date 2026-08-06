import { PrismaClient } from '@prisma/client';
import { MailContext } from './mail-context';

const createContext = (prisma: unknown) =>
  new MailContext({
    prisma: prisma as PrismaClient,
    mailProvider: {} as any,
    kv: {} as any,
    jwtGenerator: async () => '',
  });

describe('MailContext', () => {
  describe('getUsedTemplateIdentifiers', () => {
    it('includes templates from subscription intervals and user flow mails', async () => {
      const prismaMock = {
        subscriptionInterval: {
          findMany: jest.fn(() => [
            { mailTemplate: { id: 'renewal-success' } },
            { mailTemplate: null },
          ]),
        },
        userFlowMail: {
          findMany: jest.fn(() => [
            { mailTemplate: { id: 'login-link' } },
            { mailTemplate: null },
          ]),
        },
      };

      const result =
        await createContext(prismaMock).getUsedTemplateIdentifiers();

      expect(result).toEqual(['renewal-success', 'login-link']);
    });
  });
});
