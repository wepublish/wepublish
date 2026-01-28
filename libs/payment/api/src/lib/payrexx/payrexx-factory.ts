import { GatewayClient } from './gateway-client';
import { PayrexxClient } from './payrexx-client';
import { TransactionClient } from './transaction-client';

type PayrexxFactoryProps = {
  baseUrl: string;
  instance: string;
  secret: string;
};

export class PayrexxFactory {
  constructor(readonly props: PayrexxFactoryProps) {}

  get httpClient(): PayrexxClient {
    return new PayrexxClient(
      this.props.baseUrl,
      this.props.instance,
      this.props.secret
    );
  }

  get transactionClient(): TransactionClient {
    return new TransactionClient(this.httpClient);
  }

  get gatewayClient(): GatewayClient {
    return new GatewayClient(this.httpClient);
  }
}
