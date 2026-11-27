import { AuthSessionType } from '@wepublish/authentication/api';
import { CommentResolver } from './comment.resolver';

// A login code that confirmed no address yet: the guard lets it into public
// mutations, which treat it like a guest, never as the reader it belongs to.
const restricted = {
  type: AuthSessionType.User,
  restricted: true,
  user: { id: 'user-1' },
} as never;

describe('CommentResolver called with a restricted session', () => {
  const commentService = { addUserComment: vi.fn(), rateComment: vi.fn() };
  const resolver = new CommentResolver(
    commentService as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any
  );

  it('comments as a guest, not under the name of the reader', async () => {
    const input = { text: 'hello' } as any;

    await resolver.addUserComment(input, restricted);

    expect(commentService.addUserComment).toHaveBeenCalledWith(
      input,
      undefined
    );
  });

  it('rates as a guest, not under the name of the reader', async () => {
    await resolver.rateComment('comment-1', 'answer-1', 5, restricted, 'print');

    expect(commentService.rateComment).toHaveBeenCalledWith(
      'comment-1',
      'answer-1',
      5,
      'print',
      null
    );
  });
});
