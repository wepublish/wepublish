import { PaymentPeriodicity, PrismaClient } from '@prisma/client';
import { MailContext, mailLogType } from '@wepublish/mail/api';
import { GiftCodeMailService } from './gift-code-mail.service';

const issuedAt = new Date('2026-10-20T08:00:00.000Z');
const expiresAt = new Date('2027-10-20T08:00:00.000Z');
const redeemedAt = new Date('2026-11-01T08:00:00.000Z');

const buyer = { id: 'buyer-1', email: 'buyer@example.com', firstName: 'Ana' };
const redeemer = { id: 'reader-1', email: 'reader@example.com' };
const invoice = {
  id: 'inv-1',
  currency: 'CHF',
  paidAt: issuedAt,
  items: [{ name: 'Jahres-Abo verschenken', amount: 9000, quantity: 1 }],
};
const subscription = {
  id: 'sub-1',
  paidUntil: new Date('2027-11-01T00:00:00.000Z'),
  memberPlan: { name: 'Jahres-Abo' },
  paymentMethod: { name: 'Gutschein' },
  periods: [],
};

const giftCode = (overrides: Record<string, unknown> = {}) => ({
  id: 'gc-1',
  code: 'ABCDEFGHJKMN',
  recipientName: 'Max',
  periodicity: PaymentPeriodicity.yearly,
  redemptionWindowMonths: 12,
  autoRenew: false,
  issuedAt,
  expiresAt,
  redeemedAt: null,
  buyerId: buyer.id,
  createdByUserId: null,
  renewalPaymentMethodId: null,
  offer: {
    name: 'Jahres-Abo verschenken',
    price: 12000,
    purchaseMailTemplateId: 'tpl-bought',
    redemptionMailTemplateId: 'tpl-redeemed',
  },
  memberPlan: { name: 'Jahres-Abo', slug: 'jahres-abo', currency: 'CHF' },
  buyer,
  invoiceItem: { invoices: invoice },
  redeemedBy: null,
  redeemedSubscription: null,
  redeemedInvoice: null,
  ...overrides,
});

const setup = (found: ReturnType<typeof giftCode> | null = giftCode()) => {
  const prisma = {
    giftCode: { findUnique: vi.fn().mockResolvedValue(found) },
  };
  const mailContext = { sendMail: vi.fn().mockResolvedValue(undefined) };
  const service = new GiftCodeMailService(
    prisma as unknown as PrismaClient,
    mailContext as unknown as MailContext
  );

  return { service, prisma, mailContext };
};

const expectedGiftCode = {
  code: 'ABCD-EFGH-JKMN',
  recipientName: 'Max',
  periodicity: PaymentPeriodicity.yearly,
  redemptionWindowMonths: 12,
  autoRenew: false,
  issuedAt,
  expiresAt,
  offer: { name: 'Jahres-Abo verschenken' },
  memberPlan: { name: 'Jahres-Abo', slug: 'jahres-abo' },
};

describe('GiftCodeMailService', () => {
  describe('sendPurchaseMail', () => {
    it("sends the offer's purchase template to the buyer with the code and the invoice", async () => {
      const { service, mailContext } = setup();

      await service.sendPurchaseMail('gc-1');

      expect(mailContext.sendMail).toHaveBeenCalledWith({
        mailTemplateId: 'tpl-bought',
        recipient: buyer,
        mailType: mailLogType.GiftCode,
        optionalData: {
          giftCode: { ...expectedGiftCode, redeemedAt: null },
          invoice,
        },
      });
    });

    it('loads the invoice the buyer paid with its items', async () => {
      const { service, prisma } = setup();

      await service.sendPurchaseMail('gc-1');

      expect(prisma.giftCode.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'gc-1' },
          include: expect.objectContaining({
            buyer: true,
            invoiceItem: {
              include: { invoices: { include: { items: true } } },
            },
          }),
        })
      );
    });

    it('sends nothing when the offer has no purchase template', async () => {
      const { service, mailContext } = setup(
        giftCode({
          offer: { ...giftCode().offer, purchaseMailTemplateId: null },
        })
      );

      await service.sendPurchaseMail('gc-1');

      expect(mailContext.sendMail).not.toHaveBeenCalled();
    });

    // Codes an admin created, or whose buyer was deleted, have nobody to
    // tell.
    it('sends nothing without a buyer', async () => {
      const { service, mailContext } = setup(
        giftCode({ buyer: null, buyerId: null })
      );

      await service.sendPurchaseMail('gc-1');

      expect(mailContext.sendMail).not.toHaveBeenCalled();
    });

    it('sends nothing for an unknown code', async () => {
      const { service, mailContext } = setup(null);

      await service.sendPurchaseMail('gc-1');

      expect(mailContext.sendMail).not.toHaveBeenCalled();
    });

    // The code is issued whether or not the mail goes out, and the buyer can
    // still read it on the website.
    it('swallows a failing send', async () => {
      const { service, mailContext } = setup();
      mailContext.sendMail.mockRejectedValue(new Error('provider down'));

      await expect(service.sendPurchaseMail('gc-1')).resolves.toBeUndefined();
    });
  });

  describe('sendRedemptionMail', () => {
    const redeemed = (overrides: Record<string, unknown> = {}) =>
      giftCode({
        redeemedAt,
        redeemedBy: redeemer,
        redeemedSubscription: subscription,
        redeemedInvoice: invoice,
        ...overrides,
      });

    it("sends the offer's redemption template to the redeemer with the code and the subscription", async () => {
      const { service, mailContext } = setup(redeemed());

      await service.sendRedemptionMail('gc-1');

      expect(mailContext.sendMail).toHaveBeenCalledWith({
        mailTemplateId: 'tpl-redeemed',
        recipient: redeemer,
        mailType: mailLogType.GiftCode,
        optionalData: {
          giftCode: { ...expectedGiftCode, redeemedAt },
          subscription,
          invoice,
        },
      });
    });

    it('loads the subscription with its plan, payment method and periods', async () => {
      const { service, prisma } = setup(redeemed());

      await service.sendRedemptionMail('gc-1');

      expect(prisma.giftCode.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'gc-1' },
          include: expect.objectContaining({
            redeemedSubscription: {
              include: { memberPlan: true, paymentMethod: true, periods: true },
            },
            redeemedInvoice: { include: { items: true } },
          }),
        })
      );
    });

    it('sends nothing when the offer has no redemption template', async () => {
      const { service, mailContext } = setup(
        redeemed({
          offer: { ...giftCode().offer, redemptionMailTemplateId: null },
        })
      );

      await service.sendRedemptionMail('gc-1');

      expect(mailContext.sendMail).not.toHaveBeenCalled();
    });

    it('sends nothing for a code nobody redeemed', async () => {
      const { service, mailContext } = setup(giftCode());

      await service.sendRedemptionMail('gc-1');

      expect(mailContext.sendMail).not.toHaveBeenCalled();
    });

    it('swallows a failing send', async () => {
      const { service, mailContext } = setup(redeemed());
      mailContext.sendMail.mockRejectedValue(new Error('provider down'));

      await expect(service.sendRedemptionMail('gc-1')).resolves.toBeUndefined();
    });
  });
});
