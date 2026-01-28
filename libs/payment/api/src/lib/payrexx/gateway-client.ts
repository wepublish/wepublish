import { Currency } from '@prisma/client';
import { PayrexxClient } from './payrexx-client';
import { Transaction } from './transaction-client';

export type CreateGatewayRequestData = {
  psp: number[];
  pm: string[];
  referenceId: string;
  amount: number;
  fields?: Record<string, any>;
  successRedirectUrl: string;
  failedRedirectUrl: string;
  cancelRedirectUrl: string;
  vatRate: number;
  currency: Currency;
  preAuthorization?: boolean;
  chargeOnAuthorization?: boolean;
};

export type GatewayStatus = 'waiting' | 'confirmed' | 'cancelled' | 'declined';
export type Gateway = {
  id: number;
  status: GatewayStatus;
  hash: string;
  referenceId: string;
  link: string;
  invoices: Array<{
    transactions: Array<Transaction>;
  }>;
  preAuthorization: true;
  fields: [];
  psp: number[];
  pm: string[];
  amount: number;
  currency: Currency;
  vatRate: number;
  sku: string;
  applicationFee: number;
  createdAt: number;
};

type CreateGatewayResponseData = Array<Gateway>;
type GetGatewayResponseData = Array<Gateway>;

export class GatewayClient {
  constructor(private client: PayrexxClient) {}

  async createGateway(requestData: CreateGatewayRequestData) {
    const response = await this.client.post<CreateGatewayResponseData>(
      'Gateway',
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

  async getGateway(gatewayId: string) {
    const response = await this.client.get<GetGatewayResponseData>(
      'Gateway/' + encodeURIComponent(gatewayId)
    );

    if (response.status === 'error') {
      if (
        response.message ===
        'An error occurred: No Gateway found with id ' + gatewayId
      ) {
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
