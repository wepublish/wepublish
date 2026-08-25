import { Injectable, NotFoundException } from '@nestjs/common';
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
import {
  LetterTemplateInput,
  LetterTemplatePreviewInput,
} from './letter-template.model';

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

@Injectable()
export class LetterTemplateService {
  constructor(
    private prisma: PrismaClient,
    private letterContext: LetterContext
  ) {}

  async create(input: LetterTemplateInput) {
    return this.prisma.letterTemplate.create({ data: input });
  }

  async update(id: string, input: LetterTemplateInput) {
    return this.prisma.letterTemplate.update({ where: { id }, data: input });
  }

  async delete(id: string) {
    const used = await this.letterContext.getUsedTemplateIdentifiers();

    if (used.includes(id)) {
      throw new NotFoundException(
        'This letter template is still used by a communication flow.'
      );
    }

    return this.prisma.letterTemplate.delete({ where: { id } });
  }

  missingPlaceholders(htmlContent: string, contextId: MailTemplateContextId) {
    const data = assembleFullSampleMailData();
    const available = new Set(
      resolvableKeys(assembleMailData(contextId, data, '')).map(key =>
        key.toLowerCase()
      )
    );

    return extractPlaceholders(htmlContent).filter(
      key => !available.has(key.toLowerCase())
    );
  }

  async preview(input: LetterTemplatePreviewInput) {
    const template =
      input.letterTemplateId ?
        await this.prisma.letterTemplate.findUnique({
          where: { id: input.letterTemplateId },
        })
      : null;

    if (input.letterTemplateId && !template) {
      throw new NotFoundException('The given letter template was not found.');
    }

    const htmlContent = input.htmlContent ?? template?.htmlContent ?? '';
    const qrBill = input.qrBill ?? template?.qrBill ?? LetterQrBill.NONE;
    const addressPosition =
      input.addressPosition ??
      template?.addressPosition ??
      LetterAddressPosition.LEFT;
    const contextId = (input.context ??
      template?.context ??
      'custom') as MailTemplateContextId;

    const { recipient, data, invoice } = await this.previewData(input);

    const pdf = await this.letterContext.renderLetter({
      template: {
        htmlContent,
        addressPosition:
          addressPosition === LetterAddressPosition.RIGHT ? 'right' : 'left',
        qrBill,
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

  private async previewData(input: LetterTemplatePreviewInput) {
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
      throw new NotFoundException('The given subscription was not found.');
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
  id: string;
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
