import { Logger } from '@nestjs/common';
import {
  LetterLogState,
  LetterLogType,
  Prisma,
  PrismaClient,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import { LetterContext, LetterPrintSettings } from './letter-context';
import { LetterState } from './letter-provider/letter-provider.interface';
import { toLetterAddress, UserWithAddress } from './letter-recipient';
import { QrBillInvoice } from './qr-bill/qr-bill.service';

const LOG_STATES: Record<LetterState, LetterLogState> = {
  [LetterState.submitted]: LetterLogState.submitted,
  [LetterState.accepted]: LetterLogState.accepted,
  [LetterState.dispatched]: LetterLogState.dispatched,
  [LetterState.delivered]: LetterLogState.delivered,
  [LetterState.undeliverable]: LetterLogState.undeliverable,
  [LetterState.rejected]: LetterLogState.rejected,
  [LetterState.canceled]: LetterLogState.canceled,
};

export class DuplicateLetterError extends Error {}

export type LetterControllerConfig = {
  mailTemplateId: string;
  print: LetterPrintSettings;
  recipient: UserWithAddress;
  letterType: LetterLogType;
  optionalData: Record<string, any>;
  invoice?: QrBillInvoice | null;
  daysAwayFromEnding?: number | null;
  runDate?: Date | null;
  letterIdentifier?: string;
};

/**
 * Unlike the mail controller the log row is written **before** the provider is
 * called: a duplicate letter costs postage and reaches a letterbox twice, so the
 * unique `letterIdentifier` has to reject the second attempt before anything is
 * printed.
 */
export class LetterController {
  private logger = new Logger('LetterController');

  constructor(
    private prismaService: PrismaClient,
    private letterContext: LetterContext,
    private config: LetterControllerConfig
  ) {}

  generateLetterIdentifier(): string {
    return (
      this.config.letterIdentifier ??
      `${this.config.letterType}-${
        this.config.runDate ? this.config.runDate.toISOString() : 'null'
      }-${this.config.daysAwayFromEnding}-${this.config.mailTemplateId}-${
        this.config.recipient.id
      }`
    );
  }

  private buildData() {
    const recipient = JSON.parse(JSON.stringify(this.config.recipient));

    delete recipient.password;
    delete recipient.roleIDs;
    delete recipient.totpSecret;
    delete recipient.totpEnabled;
    delete recipient.totpExempt;

    return {
      user: recipient,
      optional: this.config.optionalData,
    };
  }

  public async sendLetter(): Promise<string> {
    const address = toLetterAddress(this.config.recipient);
    const letterIdentifier = this.generateLetterIdentifier();
    const letterLogId = randomUUID();

    try {
      await this.prismaService.letterLog.create({
        data: {
          id: letterLogId,
          recipient: { connect: { id: this.config.recipient.id } },
          mailTemplate: { connect: { id: this.config.mailTemplateId } },
          ...(this.config.invoice ?
            { invoice: { connect: { id: this.config.invoice.id } } }
          : {}),
          state: LetterLogState.pending,
          type: this.config.letterType,
          letterIdentifier,
          providerID: this.letterContext.letterProvider.id,
          addressSnapshot: address as unknown as Prisma.InputJsonValue,
          addressPosition: this.config.print.addressPosition,
          deliveryProduct: this.config.print.deliveryProduct,
          printMode: this.config.print.printMode,
          printSpectrum: this.config.print.printSpectrum,
          qrBill: this.config.print.qrBill,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new DuplicateLetterError(
          `Letter with id <${letterIdentifier}> was already claimed. Skipping...`
        );
      }

      throw error;
    }

    try {
      const result = await this.letterContext.sendComposedLetter({
        letterLogID: letterLogId,
        mailTemplateId: this.config.mailTemplateId,
        print: this.config.print,
        recipient: address,
        data: this.buildData(),
        invoice: this.config.invoice,
      });

      await this.prismaService.letterLog.update({
        where: { id: letterLogId },
        data: {
          state: LOG_STATES[result.state],
          providerLetterID: result.providerLetterID,
          letterData: result.letterData,
          sentDate: new Date(),
        },
      });
    } catch (error) {
      await this.prismaService.letterLog
        .update({
          where: { id: letterLogId },
          data: {
            state: LetterLogState.rejected,
            error: (error as Error).message,
          },
        })
        .catch(logError => {
          this.logger.error(
            `Could not write letter log <${letterLogId}>: ${
              (logError as Error).message
            }`
          );
        });

      throw error;
    }

    return letterLogId;
  }
}
