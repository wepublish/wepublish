import { ForbiddenException } from '@nestjs/common';
import {
  AuthSessionType,
  SESSION_RESTRICTED,
} from '@wepublish/authentication/api';
import { CommentResolver } from './comment.resolver';

// A login code that confirmed no address yet: the guard lets it into public
// mutations, so those that act under the reader's name refuse it themselves.
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

  it('neither comments nor rates under the name of the reader', async () => {
    await expect(async () =>
      resolver.addUserComment({} as any, restricted)
    ).rejects.toThrow(new ForbiddenException(SESSION_RESTRICTED));
    await expect(async () =>
      resolver.rateComment('comment-1', 'answer-1', 5, restricted, 'print')
    ).rejects.toThrow(new ForbiddenException(SESSION_RESTRICTED));

    expect(commentService.addUserComment).not.toHaveBeenCalled();
    expect(commentService.rateComment).not.toHaveBeenCalled();
  });
});
