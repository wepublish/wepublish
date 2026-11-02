import { PrismaClient } from '@prisma/client';
import { MailContext } from './mail-context';
import { EMPTY_PURL_DATA } from './mail-data';

const createContext = (prisma: unknown) =>
  new MailContext({
    prisma: prisma as PrismaClient,
    mailProvider: {} as any,
    kv: {} as any,
    jwtGenerator: async () => '',
  });

const createPrismaMock = () => ({
  subscriptionInterval: {
    findMany: vi.fn((_args?: Record<string, unknown>) => [
      { mailTemplateId: 'renewal-success' },
      { mailTemplateId: null },
    ]),
  },
  userFlowMail: {
    findMany: vi.fn((_args?: Record<string, unknown>) => [
      { mailTemplateId: 'login-link' },
      { mailTemplateId: null },
    ]),
  },
});

describe('MailContext', () => {
  describe('getUsedTemplateIdentifiers', () => {
    it('includes templates from subscription intervals and user flow mails', async () => {
      const prismaMock = createPrismaMock();

      const result =
        await createContext(prismaMock).getUsedTemplateIdentifiers();

      expect(result).toEqual(['renewal-success', 'login-link']);
    });

    // Only the template id is ever read here. Joining the template in pulled
    // every `htmlContent`/`textContent` blob across for nothing.
    it('reads only the template id, without joining the template', async () => {
      const prismaMock = createPrismaMock();

      await createContext(prismaMock).getUsedTemplateIdentifiers();

      for (const { findMany } of [
        prismaMock.subscriptionInterval,
        prismaMock.userFlowMail,
      ]) {
        const args = findMany.mock.calls[0]?.[0];

        expect(args).toBeDefined();
        expect(args).toHaveProperty('select', { mailTemplateId: true });
        expect(args).not.toHaveProperty('include');
      }
    });
  });

  describe('buildMailData', () => {
    it('keeps the login link (jwt) while personal login codes are switched off', async () => {
      const context = new MailContext({
        prisma: {} as PrismaClient,
        mailProvider: {} as any,
        kv: {} as any,
        jwtGenerator: async userId => `jwt-for-${userId}`,
        // What the login code service hands out while the medium has them off.
        purlProvider: { purlFor: async () => EMPTY_PURL_DATA },
      });

      const data = await context.buildMailData({
        recipient: { id: 'user-1' },
        optionalData: {},
        mode: 'send',
      });

      expect(data.jwt).toBe('jwt-for-user-1');
      expect(data.purl).toBe('');
      expect(data.purlCode).toBe('');
    });
  });
});
