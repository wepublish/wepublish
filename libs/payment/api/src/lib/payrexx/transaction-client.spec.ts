import { TransactionClient } from './transaction-client';
import { PayrexxClient } from './payrexx-client';

function mockClient(response: unknown): PayrexxClient {
  return {
    get: jest.fn().mockResolvedValue(response),
    post: jest.fn().mockResolvedValue(response),
  } as unknown as PayrexxClient;
}

describe('TransactionClient', () => {
  describe('retrieveTransaction', () => {
    it('returns null when Payrexx reports the transaction was not found, even if the echoed id differs from the requested id', async () => {
      const client = mockClient({
        status: 'error',
        message: 'An error occurred: No Transaction found with id 0',
      });
      const transactionClient = new TransactionClient(client);

      const result = await transactionClient.retrieveTransaction(
        'pi_3TrXIZIBGJVtSMLX0wp5vVzl'
      );

      expect(result).toBeNull();
    });

    it('throws for error responses that are not "transaction not found"', async () => {
      const client = mockClient({
        status: 'error',
        message: 'An error occurred: Invalid API signature',
      });
      const transactionClient = new TransactionClient(client);

      await expect(
        transactionClient.retrieveTransaction('123')
      ).rejects.toThrow(
        'Payrexx request has error status with message: An error occurred: Invalid API signature'
      );
    });
  });
});
