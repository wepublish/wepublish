import { sessionSurvivedConfirmation } from './confirm-email-outcome';

const clientAnswering = (answer: unknown) =>
  ({ query: vi.fn().mockResolvedValue(answer) }) as never;

describe('sessionSurvivedConfirmation', () => {
  it('holds for a session the API still knows as a full one', async () => {
    const client = clientAnswering({
      data: { sessionInfo: { restricted: false } },
    });

    expect(await sessionSurvivedConfirmation(client)).toBe(true);
  });

  it('asks the API, never the cache', async () => {
    const client = clientAnswering({ data: null });

    await sessionSurvivedConfirmation(client);

    expect((client as any).query).toHaveBeenCalledWith(
      expect.objectContaining({ fetchPolicy: 'network-only' })
    );
  });

  it.each([
    ['the session ended', { error: new Error('User authentication failed') }],
    [
      'the session is still restricted',
      { data: { sessionInfo: { restricted: true } } },
    ],
    ['the API says nothing', { data: null }],
  ])('fails when %s', async (_name, answer) => {
    expect(await sessionSurvivedConfirmation(clientAnswering(answer))).toBe(
      false
    );
  });

  it('fails when the request itself fails', async () => {
    const client = {
      query: vi.fn().mockRejectedValue(new Error('offline')),
    } as never;

    expect(await sessionSurvivedConfirmation(client)).toBe(false);
  });
});
