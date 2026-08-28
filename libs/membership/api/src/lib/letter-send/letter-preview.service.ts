import { Injectable } from '@nestjs/common';
import {
  Currency,
  LetterAddressPosition,
  LetterQrBill,
  PrismaClient,
} from '@prisma/client';
import {
  LetterAddress,
  LetterContext,
  QrBillInvoice,
} from '@wepublish/letter/api';
import { extractPlaceholders, resolvableKeys } from '@wepublish/template/api';
import {
  assembleFullSampleMailData,
  assembleMailData,
  MailTemplateContextId,
  SAMPLE_INVOICE,
} from '../mail-template/mail-template-data';
import { LetterPreviewInput } from '../mail-template/mail-template.model';

const SAMPLE_RECIPIENT: LetterAddress = {
  name: 'Jane Doe',
  street: 'Musterstrasse',
  number: '7',
  zip: '8000',
  city: 'Zürich',
  country: 'CH',
};

const SAMPLE_QR_INVOICE: QrBillInvoice = {
  id: SAMPLE_INVOICE.id,
  createdAt: new Date(),
  modifiedAt: new Date(),
  mail: SAMPLE_INVOICE.mail,
  dueAt: SAMPLE_INVOICE.dueAt,
  description: SAMPLE_INVOICE.description,
  paidAt: null,
  canceledAt: null,
  scheduledDeactivationAt: SAMPLE_INVOICE.scheduledDeactivationAt,
  manuallySetAsPaidByUserId: null,
  currency: Currency.CHF,
  subscriptionID: null,
  number: 1,
  paymentReference: null,
  items: SAMPLE_INVOICE.items.map((item, index) => ({
    id: `sample-item-${index}`,
    createdAt: new Date(),
    modifiedAt: new Date(),
    name: item.name,
    description: null,
    quantity: item.quantity,
    amount: item.amount,
    invoiceId: SAMPLE_INVOICE.id,
    discountCodeId: null,
    goodieId: null,
  })),
};

/**
 * Renders a mail template as the letter it would be printed as. The print
 * options are passed in rather than read from the template: they belong to the
 * flow step, so the preview shows them the way the step is configured.
 */
@Injectable()
export class LetterPreviewService {
  constructor(
    private prisma: PrismaClient,
    private letterContext: LetterContext
  ) {}

  missingPlaceholders(htmlContent: string, contextId: MailTemplateContextId) {
    const available = new Set(
      resolvableKeys(
        assembleMailData(contextId, assembleFullSampleMailData(), '')
      ).map(key => key.toLowerCase())
    );

    return extractPlaceholders(htmlContent).filter(
      key => !available.has(key.toLowerCase())
    );
  }

  async preview(input: LetterPreviewInput) {
    const template =
      input.mailTemplateId ?
        await this.prisma.mailTemplate.findUnique({
          where: { id: input.mailTemplateId },
        })
      : null;

    const htmlContent = input.htmlContent ?? template?.htmlContent ?? '';
    const contextId = (input.context ??
      template?.context ??
      'custom') as MailTemplateContextId;

    const { recipient, data, invoice } = await this.previewData(input);

    const pdf = await this.letterContext.renderLetter({
      template: { htmlContent },
      print: {
        addressPosition: input.addressPosition ?? LetterAddressPosition.LEFT,
        qrBill: input.qrBill ?? LetterQrBill.NONE,
      },
      data,
      recipient,
      invoice,
      persistReference: false,
    });

    return {
      pdf: pdf.toString('base64'),
      missingPlaceholders: this.missingPlaceholders(htmlContent, contextId),
    };
  }

  private async previewData(input: LetterPreviewInput) {
    if (!input.subscriptionId) {
      return {
        recipient: SAMPLE_RECIPIENT,
        data: assembleFullSampleMailData(),
        invoice: SAMPLE_QR_INVOICE,
      };
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { id: input.subscriptionId },
      include: {
        user: { include: { address: true } },
        memberPlan: true,
        paymentMethod: true,
        invoices: { include: { items: true }, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!subscription?.user) {
      return {
        recipient: SAMPLE_RECIPIENT,
        data: assembleFullSampleMailData(),
        invoice: SAMPLE_QR_INVOICE,
      };
    }

    const invoice = subscription.invoices[0] ?? SAMPLE_QR_INVOICE;
    const { user, invoices, ...rest } = subscription;

    return {
      recipient: toLetterAddressOrSample(user),
      data: {
        user,
        optional: {
          subscription: rest,
          subscriptionToCreateInvoice: rest,
          invoice,
          invoices,
          items: invoice.items,
        },
      },
      invoice,
    };
  }
}

function toLetterAddressOrSample(user: {
  firstName: string | null;
  name: string;
  address: {
    company: string | null;
    streetAddress: string | null;
    streetAddressNumber: string | null;
    zipCode: string | null;
    city: string | null;
    country: string | null;
  } | null;
}): LetterAddress {
  const address = user.address;

  if (!address?.zipCode || !address.city) {
    return SAMPLE_RECIPIENT;
  }

  return {
    name:
      address.company ||
      [user.firstName, user.name].filter(Boolean).join(' ') ||
      SAMPLE_RECIPIENT.name,
    street: address.streetAddress ?? undefined,
    number: address.streetAddressNumber ?? undefined,
    zip: address.zipCode,
    city: address.city,
    country:
      address.country?.length === 2 ? address.country.toUpperCase() : 'CH',
  };
}
