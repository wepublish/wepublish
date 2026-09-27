import { Injectable, Logger } from '@nestjs/common';
import {
  LetterAddressPosition,
  LetterDeliveryProduct,
  LetterPrintMode,
  LetterPrintSpectrum,
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
import { toLetterAddress, UserWithAddress } from './letter-recipient';
import { composeLetter, LetterTemplateContent } from './letter-renderer';
import { PdfRenderer } from './pdf/pdf-renderer';

export interface LetterContextProps {
  letterProvider: BaseLetterProvider;
  prisma: PrismaClient;
  pdfRenderer: PdfRenderer;
}

/** How a letter is printed and posted. Chosen per send, not per template. */
export interface LetterPrintSettings {
  addressPosition: LetterAddressPosition;
  deliveryProduct: LetterDeliveryProduct;
  printMode: LetterPrintMode;
  printSpectrum: LetterPrintSpectrum;
}

export interface RenderLetterProps {
  template: LetterTemplateContent;
  addressPosition: LetterAddressPosition;
  data: Record<string, any>;
  recipient: LetterAddress;
}

export interface SendTemplateLetterProps {
  mailTemplateId: string;
  recipient: UserWithAddress;
  data: Record<string, any>;
  print: LetterPrintSettings;
  /** Id the log entry has to be written under, so the caller can reference it. */
  mailLogId?: string;
  mailSendJobId?: string | null;
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
export class LetterContext {
  private readonly logger = new Logger('LetterContext');

  letterProvider: BaseLetterProvider;
  prisma: PrismaClient;
  pdfRenderer: PdfRenderer;

  constructor(props: LetterContextProps) {
    this.letterProvider = props.letterProvider;
    this.prisma = props.prisma;
    this.pdfRenderer = props.pdfRenderer;
  }

  /** Render a template as the pdf that would be printed. */
  async renderLetter({
    template,
    addressPosition,
    data,
    recipient,
  }: RenderLetterProps): Promise<Buffer> {
    return this.pdfRenderer.render(
      composeLetter({
        template,
        data,
        recipient,
        addressPosition,
      })
    );
  }

  /**
   * Render one letter, hand it to the print vendor and record the outcome in
   * the mail log. Throws if either step fails; the log entry is written either
   * way, so a failed letter leaves a trace like a failed mail does.
   */
  async sendLetter(props: SendTemplateLetterProps): Promise<string> {
    const mailLogId = props.mailLogId ?? randomUUID();
    const address = toLetterAddress(props.recipient);

    const template = await this.prisma.mailTemplate.findUnique({
      where: { id: props.mailTemplateId },
    });

    if (!template) {
      throw new Error(`MailTemplate <${props.mailTemplateId}> not found!`);
    }

    try {
      const file = await this.renderLetter({
        template: { htmlContent: template.htmlContent },
        addressPosition: props.print.addressPosition,
        data: props.data,
        recipient: address,
      });

      const result = await this.letterProvider.sendLetter({
        letterLogID: mailLogId,
        file,
        recipient: address,
        ...props.print,
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
          type: MailLogType.manual,
          sentDate: new Date(),
          subject,
          mailProviderID: this.letterProvider.id,
          mailIdentifier: mailLogId,
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
