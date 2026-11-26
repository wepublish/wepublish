import { Injectable, Logger } from '@nestjs/common';
import { GiftCode, MemberPlan, PrismaClient } from '@prisma/client';
import { MailContext, mailLogType } from '@wepublish/mail/api';
import { formatGiftCode } from './gift-code-generator';

type GiftCodeForMail = Pick<
  GiftCode,
  | 'code'
  | 'recipientName'
  | 'periodicity'
  | 'redemptionWindowMonths'
  | 'autoRenew'
  | 'issuedAt'
  | 'expiresAt'
  | 'redeemedAt'
> & {
  offer: { name: string };
  memberPlan: Pick<MemberPlan, 'name' | 'slug'>;
};

/**
 * What a gift code mail, and the documents attached to its template, can
 * print about the code: `optional_giftCode_*`. Picked field by field, so
 * neither the buyer nor the redeemer of a code ends up in the other's mail.
 * `SAMPLE_GIFT_CODE` in the membership lib's mail template data mirrors it for
 * the editor preview.
 */
export const giftCodeMailData = (giftCode: GiftCodeForMail) => ({
  code: formatGiftCode(giftCode.code),
  recipientName: giftCode.recipientName,
  periodicity: giftCode.periodicity,
  redemptionWindowMonths: giftCode.redemptionWindowMonths,
  autoRenew: giftCode.autoRenew,
  issuedAt: giftCode.issuedAt,
  expiresAt: giftCode.expiresAt,
  redeemedAt: giftCode.redeemedAt,
  offer: { name: giftCode.offer.name },
  memberPlan: {
    name: giftCode.memberPlan.name,
    slug: giftCode.memberPlan.slug,
  },
});

/**
 * Sends the templates a gift code offer chooses: one to the buyer once the
 * code is issued, one to the reader who redeemed it. An offer without a
 * template sends nothing. Never throws: the code is issued or redeemed
 * whether the mail goes out or not, and a failed send is in the mail log.
 */
@Injectable()
export class GiftCodeMailService {
  private logger = new Logger('GiftCodeMailService');

  constructor(
    private prisma: PrismaClient,
    private mailContext: MailContext
  ) {}

  async sendPurchaseMail(giftCodeId: string): Promise<void> {
    await this.send(giftCodeId, 'purchase', async () => {
      const giftCode = await this.prisma.giftCode.findUnique({
        where: { id: giftCodeId },
        include: {
          offer: true,
          memberPlan: true,
          buyer: true,
          invoiceItem: {
            include: { invoices: { include: { items: true } } },
          },
        },
      });
      const mailTemplateId = giftCode?.offer.purchaseMailTemplateId;

      if (!giftCode?.buyer || !mailTemplateId) {
        return false;
      }

      await this.mailContext.sendMail({
        mailTemplateId,
        recipient: giftCode.buyer,
        mailType: mailLogType.GiftCode,
        optionalData: {
          giftCode: giftCodeMailData(giftCode),
          invoice: giftCode.invoiceItem?.invoices,
        },
      });

      return true;
    });
  }

  async sendRedemptionMail(giftCodeId: string): Promise<void> {
    await this.send(giftCodeId, 'redemption', async () => {
      const giftCode = await this.prisma.giftCode.findUnique({
        where: { id: giftCodeId },
        include: {
          offer: true,
          memberPlan: true,
          redeemedBy: true,
          redeemedSubscription: {
            include: { memberPlan: true, paymentMethod: true, periods: true },
          },
          redeemedInvoice: { include: { items: true } },
        },
      });
      const mailTemplateId = giftCode?.offer.redemptionMailTemplateId;

      if (!giftCode?.redeemedBy || !mailTemplateId) {
        return false;
      }

      await this.mailContext.sendMail({
        mailTemplateId,
        recipient: giftCode.redeemedBy,
        mailType: mailLogType.GiftCode,
        optionalData: {
          giftCode: giftCodeMailData(giftCode),
          subscription: giftCode.redeemedSubscription,
          invoice: giftCode.redeemedInvoice,
        },
      });

      return true;
    });
  }

  private async send(
    giftCodeId: string,
    mail: 'purchase' | 'redemption',
    run: () => Promise<boolean>
  ) {
    try {
      if (await run()) {
        this.logger.log(`Sent the ${mail} mail of gift code ${giftCodeId}`);
      }
    } catch (error) {
      this.logger.error(
        `Could not send the ${mail} mail of gift code ${giftCodeId}: ${
          (error as Error).message
        }`
      );
    }
  }
}
