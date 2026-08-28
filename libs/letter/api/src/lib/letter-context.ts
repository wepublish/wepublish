import { Injectable } from '@nestjs/common';
import {
  LetterAddressPosition,
  LetterDeliveryProduct,
  LetterPrintMode,
  LetterPrintSpectrum,
  LetterQrBill,
  MessageChannel,
  PrismaClient,
} from '@prisma/client';
import { BaseLetterProvider } from './letter-provider/base-letter-provider';
import {
  LetterAddress,
  LetterAddressPosition as ProviderAddressPosition,
  LetterDeliveryProduct as ProviderDeliveryProduct,
  LetterPrintMode as ProviderPrintMode,
  LetterPrintSpectrum as ProviderPrintSpectrum,
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

/**
 * The print options a flow step carries. They live on the step, not on the
 * template: the same words can go out as a cheap reminder and as an A-Post
 * final notice.
 */
export interface LetterPrintSettings {
  addressPosition: LetterAddressPosition;
  deliveryProduct: LetterDeliveryProduct;
  printMode: LetterPrintMode;
  printSpectrum: LetterPrintSpectrum;
  qrBill: LetterQrBill;
}

export interface RenderLetterProps {
  template: LetterTemplateContent;
  print: Pick<LetterPrintSettings, 'addressPosition' | 'qrBill'>;
  data: Record<string, any>;
  recipient: LetterAddress;
  invoice?: QrBillInvoice | null;
  persistReference?: boolean;
}

export interface SendComposedLetterProps {
  mailTemplateId: string;
  letterLogID: string;
  recipient: LetterAddress;
  data: Record<string, any>;
  print: LetterPrintSettings;
  invoice?: QrBillInvoice | null;
}

export function toAddressPosition(
  addressPosition: LetterAddressPosition
): ProviderAddressPosition {
  return addressPosition === LetterAddressPosition.RIGHT ? 'right' : 'left';
}

export function toDeliveryProduct(
  deliveryProduct: LetterDeliveryProduct
): ProviderDeliveryProduct {
  return deliveryProduct.toLowerCase() as ProviderDeliveryProduct;
}

export function toPrintMode(printMode: LetterPrintMode): ProviderPrintMode {
  return printMode.toLowerCase() as ProviderPrintMode;
}

export function toPrintSpectrum(
  printSpectrum: LetterPrintSpectrum
): ProviderPrintSpectrum {
  return printSpectrum.toLowerCase() as ProviderPrintSpectrum;
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
    print,
    data,
    recipient,
    invoice,
    persistReference,
  }: RenderLetterProps): Promise<Buffer> {
    const sender = await this.organisation.getSenderAddress();

    let qrBillSvg: string | undefined;

    if (print.qrBill === LetterQrBill.LAST_PAGE) {
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
      addressPosition: toAddressPosition(print.addressPosition),
      qrBillSvg,
    });

    return this.pdfRenderer.render(html);
  }

  async sendComposedLetter({
    mailTemplateId,
    letterLogID,
    recipient,
    data,
    print,
    invoice,
  }: SendComposedLetterProps): Promise<SendLetterResult> {
    const template = await this.prisma.mailTemplate.findUnique({
      where: { id: mailTemplateId },
    });

    if (!template) {
      throw new Error(`MailTemplate <${mailTemplateId}> not found!`);
    }

    if (!template.channels.includes(MessageChannel.LETTER)) {
      throw new Error(
        `MailTemplate <${mailTemplateId}> is not marked for print. Tag it for the letter channel first.`
      );
    }

    const file = await this.renderLetter({
      template: { htmlContent: template.htmlContent },
      print,
      data,
      recipient,
      invoice,
    });

    return this.letterProvider.sendLetter({
      letterLogID,
      file,
      recipient,
      sender: await this.organisation.getSenderAddress(),
      addressPosition: toAddressPosition(print.addressPosition),
      deliveryProduct: toDeliveryProduct(print.deliveryProduct),
      printMode: toPrintMode(print.printMode),
      printSpectrum: toPrintSpectrum(print.printSpectrum),
    });
  }
}
