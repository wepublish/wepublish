import { Injectable, Logger } from '@nestjs/common';
import {
  LetterAddressPosition,
  LetterPrintMode,
  MailChannel,
  MailLogState,
  MailLogType,
  Prisma,
  PrismaClient,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import { BaseLetterProvider } from './letter-provider/base-letter-provider';
import {
  LetterAddress,
  LetterState,
} from './letter-provider/letter-provider.interface';
import { LetterSender } from '@wepublish/mail/api';
import {
  canReceiveLetters,
  toLetterAddress,
  UserWithAddress,
} from './letter-recipient';
import { LetterPrintSettings, printSettings } from './letter-print-defaults';
import {
  composeLetter,
  LetterLayoutContent,
  LetterTemplateContent,
} from './letter-renderer';
import { appendPdf } from './pdf/append-pdf';
import { PdfRenderer } from './pdf/pdf-renderer';

export interface LetterContextProps {
  letterProvider: BaseLetterProvider;
  prisma: PrismaClient;
  pdfRenderer: PdfRenderer;
  /** Where an uploaded document can be downloaded, for letter appendices. */
  documentUrl?: (documentId: string) => Promise<string>;
}

/**
 * Pingen prints Swiss QR-bills on perforated paper but only posts letters
 * carrying one within Switzerland, so the appendix is left out elsewhere.
 */
const APPENDIX_COUNTRY = 'CH';

export type { LetterPrintSettings } from './letter-print-defaults';

export interface RenderLetterProps {
  template: LetterTemplateContent;
  addressPosition: LetterAddressPosition;
  data: Record<string, any>;
  recipient: LetterAddress;
  /** Stationery to print on; none prints the bare sheet. */
  layout?: LetterLayoutContent | null;
  /** Duplex printing needs the appendix to start on an odd page. */
  printMode?: LetterPrintMode;
}

export interface SendTemplateLetterProps {
  mailTemplateId: string;
  recipient: UserWithAddress;
  data: Record<string, any>;
  /** Omitted by automated sends, which print with the provider's defaults. */
  print?: LetterPrintSettings;
  /** Id the log entry has to be written under, so the caller can reference it. */
  mailLogId?: string;
  mailSendJobId?: string | null;
  /**
   * Bookkeeping an automated send hands in: the identifier a retried run
   * recognises the letter by, and which flow it came from. A manual send is
   * logged under its own id.
   */
  log?: { mailIdentifier?: string; type?: MailLogType };
}

/** The letter states that map onto a mail log state one-to-one. */
const LOG_STATES: Record<LetterState, MailLogState> = {
  [LetterState.submitted]: MailLogState.submitted,
  [LetterState.accepted]: MailLogState.accepted,
  [LetterState.dispatched]: MailLogState.dispatched,
  [LetterState.delivered]: MailLogState.delivered,
  [LetterState.undeliverable]: MailLogState.undeliverable,
  [LetterState.rejected]: MailLogState.rejected,
  [LetterState.canceled]: MailLogState.canceled,
};

export function toProviderState(state: LetterState): MailLogState {
  return LOG_STATES[state];
}

/**
 * Sends a mail template as a printed letter. The counterpart of `MailContext`:
 * same templates, same log, different medium.
 */
@Injectable()
export class LetterContext implements LetterSender {
  private readonly logger = new Logger('LetterContext');

  letterProvider: BaseLetterProvider;
  prisma: PrismaClient;
  pdfRenderer: PdfRenderer;
  private readonly documentUrl?: LetterContextProps['documentUrl'];
  // Uploaded documents never change under their id, so one download serves
  // every letter of a send job.
  private readonly appendices = new Map<string, Promise<Buffer>>();

  constructor(props: LetterContextProps) {
    this.letterProvider = props.letterProvider;
    this.prisma = props.prisma;
    this.pdfRenderer = props.pdfRenderer;
    this.documentUrl = props.documentUrl;
  }

  /**
   * Whether letters can be sent at all: a vendor to post them and a renderer to
   * print them, each with its credentials filled in. The registry's swappable
   * providers answer `in` with false while no integration is loaded, so this is
   * safe to ask without one.
   */
  async isConfigured(): Promise<boolean> {
    if (
      !('sendLetter' in this.letterProvider && 'render' in this.pdfRenderer)
    ) {
      return false;
    }

    const [letterProvider, pdfRenderer] = await Promise.all([
      this.letterProvider.isConfigured(),
      this.pdfRenderer.isConfigured(),
    ]);

    return letterProvider && pdfRenderer;
  }

  /** Render a template as the pdf that would be printed. */
  async renderLetter({
    template,
    addressPosition,
    data,
    recipient,
    layout,
    printMode,
  }: RenderLetterProps): Promise<Buffer> {
    const letter = await this.pdfRenderer.render(
      composeLetter({
        template,
        data,
        recipient,
        addressPosition,
        layout,
      })
    );

    if (!template.letterAppendixId) {
      return letter;
    }

    if (recipient.country !== APPENDIX_COUNTRY) {
      this.logger.warn(
        `Letter appendix <${template.letterAppendixId}> left out for a recipient in ${recipient.country}`
      );

      return letter;
    }

    return appendPdf(
      letter,
      await this.loadAppendix(template.letterAppendixId),
      {
        padToOddPage: printMode === LetterPrintMode.duplex,
      }
    );
  }

  private loadAppendix(documentId: string): Promise<Buffer> {
    let appendix = this.appendices.get(documentId);

    if (!appendix) {
      appendix = this.downloadAppendix(documentId);
      // A failed download is retried by the next letter, not cached.
      appendix.catch(() => this.appendices.delete(documentId));
      this.appendices.set(documentId, appendix);
    }

    return appendix;
  }

  private async downloadAppendix(documentId: string): Promise<Buffer> {
    if (!this.documentUrl) {
      throw new Error('Letter appendices need a document storage');
    }

    const url = await this.documentUrl(documentId);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Letter appendix <${documentId}> could not be downloaded: ${response.status}`
      );
    }

    const file = Buffer.from(await response.arrayBuffer());

    if (file.subarray(0, 5).toString() !== '%PDF-') {
      throw new Error(`Letter appendix <${documentId}> is not a pdf`);
    }

    return file;
  }

  /**
   * The stationery a template is printed on: its own if it names one, else
   * the default, else none. Both lookups go to the database on every letter;
   * a send job prints a few hundred at most, so that is cheaper than a cache
   * that has to be told about every edit.
   */
  async resolveLayout(
    letterLayoutId?: string | null
  ): Promise<LetterLayoutContent | null> {
    const own =
      letterLayoutId ?
        await this.prisma.letterLayout.findUnique({
          where: { id: letterLayoutId },
        })
      : null;

    return (
      own ??
      (await this.prisma.letterLayout.findFirst({ where: { isDefault: true } }))
    );
  }

  /**
   * Render one letter, hand it to the print vendor and record the outcome in
   * the mail log. Throws if either step fails; the log entry is written either
   * way, so a failed letter leaves a trace like a failed mail does.
   */
  /** Whether the user's postal address is complete enough to be posted to. */
  canReceiveLetters(user: UserWithAddress): boolean {
    return canReceiveLetters(user);
  }

  /**
   * Print options for a send nobody chose them for: the provider's defaults,
   * where set, over the built-in ones.
   */
  async resolvePrintDefaults(): Promise<LetterPrintSettings> {
    const settings = await this.prisma.settingLetterProvider.findUnique({
      where: { id: this.letterProvider.id },
    });

    return printSettings({
      addressPosition: settings?.defaultAddressPosition,
      deliveryProduct: settings?.defaultDeliveryProduct,
      printMode: settings?.defaultPrintMode,
      printSpectrum: settings?.defaultPrintSpectrum,
    });
  }

  async sendLetter(props: SendTemplateLetterProps): Promise<string> {
    const mailLogId = props.mailLogId ?? randomUUID();
    const address = toLetterAddress(props.recipient);
    const print = props.print ?? (await this.resolvePrintDefaults());

    const template = await this.prisma.mailTemplate.findUnique({
      where: { id: props.mailTemplateId },
    });

    if (!template) {
      throw new Error(`MailTemplate <${props.mailTemplateId}> not found!`);
    }

    try {
      const file = await this.renderLetter({
        template: {
          htmlContent: template.htmlContent,
          letterAppendixId: template.letterAppendixId,
        },
        addressPosition: print.addressPosition,
        data: props.data,
        recipient: address,
        layout: await this.resolveLayout(template.letterLayoutId),
        printMode: print.printMode,
      });

      const result = await this.letterProvider.sendLetter({
        letterLogID: mailLogId,
        file,
        recipient: address,
        ...print,
      });

      await this.writeLog(mailLogId, props, template.subject, address, {
        state: LOG_STATES[result.state],
        providerLetterID: result.providerLetterID,
        letterData: result.letterData,
      });
    } catch (error) {
      await this.writeLog(mailLogId, props, template.subject, address, {
        state: MailLogState.rejected,
        error: (error as Error).message,
      });

      throw error;
    }

    return mailLogId;
  }

  private async writeLog(
    mailLogId: string,
    props: SendTemplateLetterProps,
    subject: string,
    address: LetterAddress,
    outcome: {
      state: MailLogState;
      providerLetterID?: string;
      letterData?: string;
      error?: string;
    }
  ): Promise<void> {
    try {
      await this.prisma.mailLog.create({
        data: {
          id: mailLogId,
          channel: MailChannel.letter,
          recipient: { connect: { id: props.recipient.id } },
          mailTemplate: { connect: { id: props.mailTemplateId } },
          ...(props.mailSendJobId ?
            { mailSendJob: { connect: { id: props.mailSendJobId } } }
          : {}),
          state: outcome.state,
          type: props.log?.type ?? MailLogType.manual,
          sentDate: new Date(),
          subject,
          mailProviderID: this.letterProvider.id,
          mailIdentifier: props.log?.mailIdentifier ?? mailLogId,
          providerLetterID: outcome.providerLetterID ?? null,
          mailData: outcome.letterData ?? null,
          error: outcome.error ?? null,
          addressSnapshot: address as unknown as Prisma.InputJsonValue,
        },
      });
    } catch (logError) {
      // Never let bookkeeping mask the delivery outcome.
      this.logger.error(
        `Could not write letter log <${mailLogId}>: ${
          (logError as Error).message
        }`
      );

      if (outcome.state !== MailLogState.rejected) {
        throw logError;
      }
    }
  }
}
