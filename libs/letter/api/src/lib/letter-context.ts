import { Injectable } from '@nestjs/common';
import { LetterQrBill, LetterTemplate, PrismaClient } from '@prisma/client';
import { BaseLetterProvider } from './letter-provider/base-letter-provider';
import {
  LetterAddress,
  LetterAddressPosition,
  LetterDeliveryProduct,
  LetterPrintMode,
  LetterPrintSpectrum,
  SendLetterResult,
} from './letter-provider/letter-provider.interface';
import { composeLetter, LetterTemplateContent } from './letter-renderer';
import { PdfRenderer } from './pdf/pdf-renderer';
import { QrBillInvoice, QrBillService } from './qr-bill/qr-bill.service';
import { OrganisationService } from './organisation/organisation.service';

export interface LetterContextProps {
  letterProvider: BaseLetterProvider;
  prisma: PrismaClient;
  pdfRenderer: PdfRenderer;
  qrBill: QrBillService;
  organisation: OrganisationService;
}

export interface RenderLetterProps {
  template: LetterTemplateContent & {
    addressPosition: LetterAddressPosition;
    qrBill: LetterQrBill;
  };
  data: Record<string, any>;
  recipient: LetterAddress;
  invoice?: QrBillInvoice | null;
  persistReference?: boolean;
}

export interface SendComposedLetterProps {
  letterTemplateId: string;
  letterLogID: string;
  recipient: LetterAddress;
  data: Record<string, any>;
  invoice?: QrBillInvoice | null;
}

export function toAddressPosition(
  template: LetterTemplate
): LetterAddressPosition {
  return template.addressPosition === 'RIGHT' ? 'right' : 'left';
}

export function toDeliveryProduct(
  template: LetterTemplate
): LetterDeliveryProduct {
  return template.deliveryProduct.toLowerCase() as LetterDeliveryProduct;
}

export function toPrintMode(template: LetterTemplate): LetterPrintMode {
  return template.printMode.toLowerCase() as LetterPrintMode;
}

export function toPrintSpectrum(template: LetterTemplate): LetterPrintSpectrum {
  return template.printSpectrum.toLowerCase() as LetterPrintSpectrum;
}

@Injectable()
export class LetterContext {
  letterProvider: BaseLetterProvider;
  prisma: PrismaClient;
  pdfRenderer: PdfRenderer;
  qrBill: QrBillService;
  organisation: OrganisationService;

  constructor(props: LetterContextProps) {
    this.letterProvider = props.letterProvider;
    this.prisma = props.prisma;
    this.pdfRenderer = props.pdfRenderer;
    this.qrBill = props.qrBill;
    this.organisation = props.organisation;
  }

  async renderLetter({
    template,
    data,
    recipient,
    invoice,
    persistReference,
  }: RenderLetterProps): Promise<Buffer> {
    const sender = await this.organisation.getSenderAddress();

    let qrBillSvg: string | undefined;

    if (template.qrBill === LetterQrBill.LAST_PAGE) {
      if (!invoice) {
        throw new Error(
          'The letter template asks for a QR bill but no invoice is bound to this send'
        );
      }

      qrBillSvg = await this.qrBill.build({
        invoice,
        debtor: recipient,
        persistReference,
      });
    }

    const html = composeLetter({
      template,
      data,
      recipient,
      sender,
      addressPosition: template.addressPosition,
      qrBillSvg,
    });

    return this.pdfRenderer.render(html);
  }

  async sendComposedLetter({
    letterTemplateId,
    letterLogID,
    recipient,
    data,
    invoice,
  }: SendComposedLetterProps): Promise<SendLetterResult> {
    const template = await this.prisma.letterTemplate.findUnique({
      where: { id: letterTemplateId },
    });

    if (!template) {
      throw new Error(`LetterTemplate <${letterTemplateId}> not found!`);
    }

    const file = await this.renderLetter({
      template: {
        htmlContent: template.htmlContent,
        addressPosition: toAddressPosition(template),
        qrBill: template.qrBill,
      },
      data,
      recipient,
      invoice,
    });

    return this.letterProvider.sendLetter({
      letterLogID,
      file,
      recipient,
      sender: await this.organisation.getSenderAddress(),
      addressPosition: toAddressPosition(template),
      deliveryProduct: toDeliveryProduct(template),
      printMode: toPrintMode(template),
      printSpectrum: toPrintSpectrum(template),
    });
  }

  async getUsedTemplateIdentifiers(): Promise<string[]> {
    const [intervals, userFlowLetters] = await Promise.all([
      this.prisma.subscriptionInterval.findMany({
        select: { letterTemplateId: true },
      }),
      this.prisma.userFlowMail.findMany({
        select: { letterTemplateId: true },
      }),
    ]);

    return [
      ...intervals.flatMap(interval => interval.letterTemplateId ?? []),
      ...userFlowLetters.flatMap(
        userFlowLetter => userFlowLetter.letterTemplateId ?? []
      ),
    ];
  }
}
