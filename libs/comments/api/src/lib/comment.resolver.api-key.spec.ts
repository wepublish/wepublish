import { ForbiddenException } from '@nestjs/common';
import {
  ApiTokenSession,
  AuthSessionType,
} from '@wepublish/authentication/api';
import { CommentResolver } from './comment.resolver';

const apiKey: ApiTokenSession = {
  type: AuthSessionType.ApiToken,
  id: 'api-token-1',
  name: 'Import',
  token: 'secret',
  permissions: [],
  createdBy: { id: 'creator-1', email: 'creator@example.test' },
};

describe('CommentResolver called with an api key', () => {
  const commentService = {
    addUserComment: vi.fn(),
    updateUserComment: vi.fn(),
    rateComment: vi.fn(),
  };
  const resolver = new CommentResolver(
    commentService as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any
  );

  it('comments and rates like a guest, as nobody is signed in', async () => {
    await resolver.addUserComment({} as any, apiKey);
    await resolver.rateComment('comment-1', 'answer-1', 5, apiKey, 'print');

    expect(commentService.addUserComment).toHaveBeenCalledWith({}, undefined);
    expect(commentService.rateComment).toHaveBeenCalledWith(
      'comment-1',
      'answer-1',
      5,
      'print',
      null
    );
  });

  it('has no comments of its own to update', async () => {
    await expect(async () =>
      resolver.updateUserComment({} as any, apiKey)
    ).rejects.toThrow(ForbiddenException);
    expect(commentService.updateUserComment).not.toHaveBeenCalled();
  });
});
