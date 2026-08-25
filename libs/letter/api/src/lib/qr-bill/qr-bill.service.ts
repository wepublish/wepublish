import { Injectable } from '@nestjs/common';
import {
  Invoice,
  InvoiceItem,
  PrismaClient,
  QrBillReferenceType,
  SettingOrganisation,
} from '@prisma/client';
import { SwissQRBill } from 'swissqrbill/svg';
import {
  calculateQRReferenceChecksum,
  calculateSCORReferenceChecksum,
  isIBANValid,
  isQRIBAN,
} from 'swissqrbill/utils';
import { LetterAddress } from '../letter-provider/letter-provider.interface';
import { OrganisationService } from '../organisation/organisation.service';

const QR_REFERENCE_LENGTH = 26;

const SCOR_REFERENCE_MAX_LENGTH = 21;

const MAX_AMOUNT = 999999999.99;

export class QrBillError extends Error {}

export interface QrBillInvoice extends Invoice {
  items: InvoiceItem[];
}

export interface BuildQrBillProps {
  invoice: QrBillInvoice;
  debtor: LetterAddress;
  persistReference?: boolean;
}

export function invoiceTotalInRappen(items: InvoiceItem[]): number {
  return items.reduce((total, item) => total + item.amount * item.quantity, 0);
}

export function buildQrReference(invoiceNumber: number): string {
  const digits = String(invoiceNumber).padStart(QR_REFERENCE_LENGTH, '0');

  if (digits.length > QR_REFERENCE_LENGTH) {
    throw new QrBillError(
      `Invoice number ${invoiceNumber} does not fit into a QR reference`
    );
  }

  return `${digits}${calculateQRReferenceChecksum(digits)}`;
}

export function buildScorReference(invoiceNumber: number): string {
  const reference = String(invoiceNumber);

  if (reference.length > SCOR_REFERENCE_MAX_LENGTH) {
    throw new QrBillError(
      `Invoice number ${invoiceNumber} does not fit into a creditor reference`
    );
  }

  return `RF${calculateSCORReferenceChecksum(reference)}${reference}`;
}

@Injectable()
export class QrBillService {
  constructor(
    private prisma: PrismaClient,
    private organisation: OrganisationService
  ) {}

  async ensurePaymentReference(
    invoice: Invoice,
    persist = true
  ): Promise<string | null> {
    const settings = await this.organisation.getOrThrow();

    if (settings.referenceType === QrBillReferenceType.NON) {
      return null;
    }

    if (invoice.paymentReference) {
      return invoice.paymentReference;
    }

    const reference =
      settings.referenceType === QrBillReferenceType.QRR ?
        buildQrReference(invoice.number)
      : buildScorReference(invoice.number);

    if (persist) {
      await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: { paymentReference: reference },
      });
    }

    return reference;
  }

  async build({
    invoice,
    debtor,
    persistReference = true,
  }: BuildQrBillProps): Promise<string> {
    const settings = await this.organisation.getOrThrow();

    this.assertCreditor(settings);

    const amount = invoiceTotalInRappen(invoice.items) / 100;

    if (amount <= 0 || amount > MAX_AMOUNT) {
      throw new QrBillError(
        `Invoice ${invoice.id} has an amount that cannot be printed on a QR bill`
      );
    }

    const reference = await this.ensurePaymentReference(
      invoice,
      persistReference
    );

    return new SwissQRBill(
      {
        amount,
        currency: invoice.currency,
        creditor: {
          account: settings.iban as string,
          name: settings.name as string,
          address: settings.street ?? '',
          buildingNumber: settings.number ?? '',
          zip: settings.zip as string,
          city: settings.city as string,
          country: settings.country as string,
        },
        debtor: {
          name: debtor.name,
          address: debtor.street ?? '',
          buildingNumber: debtor.number ?? '',
          zip: debtor.zip,
          city: debtor.city,
          country: debtor.country,
        },
        ...(reference ? { reference } : {}),
      },
      {
        language: 'DE',
        fontName: 'Helvetica',
      }
    ).toString();
  }

  private assertCreditor(settings: SettingOrganisation): void {
    if (!settings.iban) {
      throw new QrBillError('No iban configured for the organisation');
    }

    if (!isIBANValid(settings.iban)) {
      throw new QrBillError('The configured organisation iban is not valid');
    }

    if (
      !settings.name ||
      !settings.zip ||
      !settings.city ||
      !settings.country
    ) {
      throw new QrBillError(
        'The organisation settings are missing name, zip, city or country'
      );
    }

    const qrIban = isQRIBAN(settings.iban);

    if (qrIban && settings.referenceType !== QrBillReferenceType.QRR) {
      throw new QrBillError(
        'A QR-IBAN requires a QR reference (QRR) as reference type'
      );
    }

    if (!qrIban && settings.referenceType === QrBillReferenceType.QRR) {
      throw new QrBillError(
        'A QR reference (QRR) requires a QR-IBAN as organisation iban'
      );
    }
  }
}
