import { ForbiddenException } from '@nestjs/common';
import {
  ApiTokenSession,
  AuthSessionType,
} from '@wepublish/authentication/api';
import { PollVoteResolver } from './poll-vote.resolver';

const apiKey: ApiTokenSession = {
  type: AuthSessionType.ApiToken,
  id: 'api-token-1',
  name: 'Import',
  token: 'secret',
  permissions: [],
  createdBy: { id: 'creator-1', email: 'creator@example.test' },
};

describe('PollVoteResolver called with an api key', () => {
  it('has no vote of its own', async () => {
    const resolver = new PollVoteResolver({} as any);

    await expect(async () =>
      resolver.userPollVote('poll-1', apiKey)
    ).rejects.toThrow(ForbiddenException);
  });
});
