import { PayrexxClient } from './payrexx-client';

type ChargeTransactionRequestData = {
  amount: number;
  purpose?: string;
  referenceId: string;
};

export type TransactionStatus =
  | 'waiting'
  | 'confirmed'
  | 'cancelled'
  | 'declined'
  | 'authorized'
  | 'reserved'
  | 'refunded'
  | 'refundpending'
  | 'partially-refunded'
  | 'chargeback'
  | 'error'
  | '_ uncaptured';

type Subscription = object;

export type Transaction = {
  id: number;
  uuid: string;
  referenceId: string;
  time: string;
  status: TransactionStatus;
  lang: string;
  psp: string;
  amount: number;
  preAuthorizationId?: number;
  subscription: null | Subscription;
};

type ChargeTransactionResponseData = Array<Transaction>;
type RetrieveTransactionResponseData = Array<Transaction>;

export class TransactionClient {
  constructor(private client: PayrexxClient) {}

  async chargePreAuthorizedTransaction(
    preAuthorizedTransactionId: number,
    requestData: ChargeTransactionRequestData
  ) {
    const response = await this.client.post<ChargeTransactionResponseData>(
      'Transaction/' + preAuthorizedTransactionId,
      requestData
    );

    if (response.status === 'error') {
      throw new Error(
        `Payrexx request has error status with message: ${response.message}`
      );
    }

    if (!response.data[0]) {
      throw new Error('Cannot find created gateway');
    }
    return response.data[0];
  }

  async retrieveTransaction(transactionId: string) {
    const response = await this.client.get<RetrieveTransactionResponseData>(
      'Transaction/' + encodeURIComponent(transactionId)
    );

    if (response.status === 'error') {
      // Payrexx parses the id path segment to an integer server-side, so a
      // non-numeric id is echoed back as "id 0". Match the message regardless
      // of the echoed id instead of reconstructing the exact string.
      if (response.message.includes('No Transaction found with id')) {
        return null;
      } else {
        throw new Error(
          `Payrexx request has error status with message: ${response.message}`
        );
      }
    }
    return response.data[0];
  }
}
