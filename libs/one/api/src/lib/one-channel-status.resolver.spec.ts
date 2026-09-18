import { OneChannelStateService } from './one-channel-state.service';
import { OneChannelConnectionState } from './one-channel-status.model';
import { OneChannelStatusResolver } from './one-channel-status.resolver';

describe('OneChannelStatusResolver', () => {
  const attemptedAt = new Date('2026-09-16T12:05:00.000Z');
  const succeededAt = new Date('2026-09-16T12:00:00.000Z');
  let state: { getState: jest.Mock };

  function makeResolver(oneURL: string) {
    return new OneChannelStatusResolver(
      state as unknown as OneChannelStateService,
      oneURL
    );
  }

  beforeEach(() => {
    state = {
      getState: jest.fn().mockResolvedValue({
        lastSuccessAt: succeededAt,
        lastAttemptAt: succeededAt,
        lastError: null,
      }),
    };
  });

  it('reports NotConfigured when WEP_ONE_URL is empty', async () => {
    const status = await makeResolver('').getOneChannelStatus();

    expect(status.state).toBe(OneChannelConnectionState.NotConfigured);
    expect(status.oneUrl).toBeNull();
    expect(state.getState).not.toHaveBeenCalled();
  });

  it('reports Connected when the most recent attempt succeeded', async () => {
    const status = await makeResolver(
      'https://one.wepublish.ch'
    ).getOneChannelStatus();

    expect(status.state).toBe(OneChannelConnectionState.Connected);
    expect(status.oneUrl).toBe('https://one.wepublish.ch');
    expect(status.lastSuccessAt).toBe(succeededAt);
  });

  it('reports Failing when the most recent attempt failed', async () => {
    state.getState.mockResolvedValue({
      lastSuccessAt: succeededAt,
      lastAttemptAt: attemptedAt,
      lastError: '403 Forbidden',
    });

    const status = await makeResolver(
      'https://one.wepublish.ch'
    ).getOneChannelStatus();

    expect(status.state).toBe(OneChannelConnectionState.Failing);
    expect(status.lastError).toBe('403 Forbidden');
    expect(status.lastSuccessAt).toBe(succeededAt);
  });

  it('reports Failing before the first attempt has completed', async () => {
    state.getState.mockResolvedValue({
      lastSuccessAt: null,
      lastAttemptAt: null,
      lastError: null,
    });

    const status = await makeResolver(
      'https://one.wepublish.ch'
    ).getOneChannelStatus();

    expect(status.state).toBe(OneChannelConnectionState.Failing);
  });
});
