import { LetterProviderType } from '@prisma/client';
import { NextHandleFunction } from 'connect';
import express from 'express';

export enum LetterState {
  submitted = 'submitted',
  accepted = 'accepted',
  dispatched = 'dispatched',
  delivered = 'delivered',
  undeliverable = 'undeliverable',
  rejected = 'rejected',
  canceled = 'canceled',
}

export type LetterAddressPosition = 'left' | 'right';

export type LetterDeliveryProduct =
  | 'fast'
  | 'cheap'
  | 'bulk'
  | 'premium'
  | 'registered';

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
  req: express.Request;
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

  sendLetter(props: SendLetterProps): Promise<SendLetterResult>;

  dispatchLetter(props: DispatchLetterProps): Promise<void>;

  cancelLetter(providerLetterID: string): Promise<void>;

  getLetterFile(providerLetterID: string): Promise<Buffer>;

  getMessageStates(
    providerLetterIDs: string[]
  ): Promise<LetterProviderMessageState[]>;

  getName(): Promise<string>;

  initDatabaseConfiguration(type: LetterProviderType): Promise<void>;
}
