import { ForbiddenException } from '@nestjs/common';
import {
  AuthSessionType,
  SESSION_RESTRICTED,
} from '@wepublish/authentication/api';
import { PollVoteResolver } from './poll-vote.resolver';

describe('PollVoteResolver called with a restricted session', () => {
  it('does not vote under the name of the reader', async () => {
    const pollService = { voteOnPoll: vi.fn() };
    const resolver = new PollVoteResolver(pollService as any);

    await expect(async () =>
      resolver.voteOnPoll(
        'answer-1',
        {
          type: AuthSessionType.User,
          restricted: true,
          user: { id: 'user-1' },
        } as never,
        'print'
      )
    ).rejects.toThrow(new ForbiddenException(SESSION_RESTRICTED));

    expect(pollService.voteOnPoll).not.toHaveBeenCalled();
  });
});
