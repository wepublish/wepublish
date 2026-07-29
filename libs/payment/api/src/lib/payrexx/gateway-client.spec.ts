import { GatewayClient } from './gateway-client';
import { PayrexxClient } from './payrexx-client';

function mockClient(response: unknown): PayrexxClient {
  return {
    get: jest.fn().mockResolvedValue(response),
    post: jest.fn().mockResolvedValue(response),
  } as unknown as PayrexxClient;
}

describe('GatewayClient', () => {
  describe('getGateway', () => {
    it('returns null when Payrexx reports the gateway was not found, even if the echoed id differs from the requested id', async () => {
      // Payrexx parses the id path segment to an integer server-side, so a
      // non-numeric intent id (e.g. a Stripe intent id) comes back echoed as
      // "id 0". The not-found response must still be recognised.
      const client = mockClient({
        status: 'error',
        message: 'An error occurred: No Gateway found with id 0',
      });
      const gatewayClient = new GatewayClient(client);

      const result = await gatewayClient.getGateway(
        'pi_3TrXIZIBGJVtSMLX0wp5vVzl'
      );

      expect(result).toBeNull();
    });

    it('throws for error responses that are not "gateway not found"', async () => {
      const client = mockClient({
        status: 'error',
        message: 'An error occurred: Invalid API signature',
      });
      const gatewayClient = new GatewayClient(client);

      await expect(gatewayClient.getGateway('123')).rejects.toThrow(
        'Payrexx request has error status with message: An error occurred: Invalid API signature'
      );
    });
  });
});
