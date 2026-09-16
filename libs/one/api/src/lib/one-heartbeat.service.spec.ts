import { OneChannelStateService } from './one-channel-state.service';
import { OneClientService } from './one-client.service';
import { OneHeartbeatService } from './one-heartbeat.service';

describe('OneHeartbeatService', () => {
  let client: { post: jest.Mock };
  let state: { recordSuccess: jest.Mock; recordFailure: jest.Mock };

  function makeService(oneURL: string) {
    return new OneHeartbeatService(
      client as unknown as OneClientService,
      state as unknown as OneChannelStateService,
      oneURL
    );
  }

  beforeEach(() => {
    client = { post: jest.fn().mockResolvedValue(undefined) };
    state = {
      recordSuccess: jest.fn().mockResolvedValue(undefined),
      recordFailure: jest.fn(),
    };
  });

  it('does nothing when WEP_ONE_URL is not configured', async () => {
    await makeService('').send();

    expect(client.post).not.toHaveBeenCalled();
    expect(state.recordSuccess).not.toHaveBeenCalled();
    expect(state.recordFailure).not.toHaveBeenCalled();
  });

  it('posts a heartbeat and records the success', async () => {
    await makeService('https://one.wepublish.ch').send();

    expect(client.post).toHaveBeenCalledWith(
      '/channel/heartbeat',
      'write:medium-heartbeat',
      expect.objectContaining({ version: expect.any(String) })
    );
    expect(state.recordSuccess).toHaveBeenCalled();
  });

  it('records a failure instead of throwing when One is unreachable', async () => {
    client.post.mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(
      makeService('https://one.wepublish.ch').send()
    ).resolves.toBeUndefined();

    expect(state.recordFailure).toHaveBeenCalledWith(
      expect.any(Date),
      'ECONNREFUSED'
    );
  });

  it('does not throw out of application bootstrap', async () => {
    client.post.mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(
      makeService('https://one.wepublish.ch').onApplicationBootstrap()
    ).resolves.toBeUndefined();
  });
});
