import { AuthSessionType } from '@wepublish/authentication/api';
import { PollVoteResolver } from './poll-vote.resolver';

describe('PollVoteResolver called with a restricted session', () => {
  // A login code that confirmed no address yet votes like a guest, by
  // fingerprint, never as the reader it belongs to.
  it('votes as a guest, not under the name of the reader', async () => {
    const pollService = { voteOnPoll: vi.fn() };
    const resolver = new PollVoteResolver(pollService as any);

    await resolver.voteOnPoll(
      'answer-1',
      {
        type: AuthSessionType.User,
        restricted: true,
        user: { id: 'user-1' },
      } as never,
      'print'
    );

    expect(pollService.voteOnPoll).toHaveBeenCalledWith(
      'answer-1',
      'print',
      undefined
    );
  });
});
