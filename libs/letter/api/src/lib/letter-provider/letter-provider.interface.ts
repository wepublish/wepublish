import { LetterProviderType } from '@prisma/client';
import { NextHandleFunction } from 'connect';
import type { NodeRequest } from '@nestjs/platform-node';

export enum LetterState {
  submitted = 'submitted',
  accepted = 'accepted',
  dispatched = 'dispatched',
  delivered = 'delivered',
  undeliverable = 'undeliverable',
  rejected = 'rejected',
  canceled = 'canceled',
  /**
   * The vendor took the letter and holds it until someone looks at it there,
   * e.g. because its check of the pdf failed. Unlike `rejected` the letter
   * exists at the vendor.
   */
  actionRequired = 'actionRequired',
}

export type LetterAddressPosition = 'left' | 'right';

export type LetterDeliveryProduct =
  'fast' | 'cheap' | 'bulk' | 'premium' | 'registered';

export type LetterPrintMode = 'simplex' | 'duplex';

export type LetterPrintSpectrum = 'color' | 'grayscale';

export interface LetterAddress {
  name: string;
  street?: string;
  pobox?: string;
  number?: string;
  zip: string;
  city: string;
  country: string;
}

export interface LetterPrintOptions {
  addressPosition?: LetterAddressPosition;
  deliveryProduct?: LetterDeliveryProduct;
  printMode?: LetterPrintMode;
  printSpectrum?: LetterPrintSpectrum;
}

export interface SendLetterProps extends LetterPrintOptions {
  letterLogID: string;
  file: Buffer;
  fileName?: string;
  recipient: LetterAddress;
  sender?: LetterAddress;
  autoSend?: boolean;
}

export interface SendLetterResult {
  providerLetterID: string;
  state: LetterState;
  letterData?: string;
}

export interface DispatchLetterProps {
  providerLetterID: string;
  deliveryProduct: LetterDeliveryProduct;
  printMode: LetterPrintMode;
  printSpectrum: LetterPrintSpectrum;
}

export interface WebhookForSendLetterProps {
  req: NodeRequest;
}

export interface LetterLogStatus {
  providerLetterID: string;
  state: LetterState;
  letterData?: string;
  error?: string;
}

export interface LetterProviderMessageState {
  providerLetterID: string;
  state: LetterState;
  letterData?: string;
  /**
   * The vendor no longer knows the letter. For one it had not printed yet
   * that means someone removed it there; a printed one has merely aged out.
   */
  gone?: true;
}

export class LetterProviderError extends Error {
  constructor(
    message: string,
    readonly statusCode?: number,
    readonly retryAfterMs?: number,
    readonly body?: unknown
  ) {
    super(message);
    this.name = 'LetterProviderError';
  }
}

export interface LetterProvider {
  readonly id: string;

  readonly incomingRequestHandler: NextHandleFunction;

  webhookForSendLetter(
    props: WebhookForSendLetterProps
  ): Promise<LetterLogStatus[]>;

  /** Whether everything needed to send is set, so letters can be offered. */
  isConfigured(): Promise<boolean>;

  sendLetter(props: SendLetterProps): Promise<SendLetterResult>;

  dispatchLetter(props: DispatchLetterProps): Promise<void>;

  cancelLetter(providerLetterID: string): Promise<void>;

  /**
   * Removes a letter the vendor holds without having printed it, so another
   * one can take its place. Throws when the vendor does not let it go.
   */
  deleteLetter(providerLetterID: string): Promise<void>;

  /**
   * Whether the vendor prints what it is handed without a person confirming
   * each letter there.
   */
  sendsAutomatically(): Promise<boolean>;

  getLetterFile(providerLetterID: string): Promise<Buffer>;

  getMessageStates(
    providerLetterIDs: string[]
  ): Promise<LetterProviderMessageState[]>;

  getName(): Promise<string>;

  initDatabaseConfiguration(type: LetterProviderType): Promise<void>;
}
