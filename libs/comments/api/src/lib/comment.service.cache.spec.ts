import { CommentState } from '@prisma/client';
import { CommentService } from './comment.service';
import { RatingSystemService } from './rating-system/rating-system.service';

const session = { user: { id: 'user-1' }, roles: [] } as any;

const createPrisma = () => ({
  comment: {
    create: jest.fn().mockResolvedValue({ id: 'comment-1' }),
    update: jest.fn().mockResolvedValue({ id: 'comment-1' }),
    delete: jest.fn().mockResolvedValue({ id: 'comment-1' }),
    findUnique: jest.fn().mockResolvedValue({
      id: 'comment-1',
      userID: 'user-1',
      state: CommentState.pendingUserChanges,
      revisions: [],
    }),
  },
  commentRatingSystem: {
    update: jest.fn().mockResolvedValue({ id: 'system-1', answers: [] }),
  },
  commentRatingSystemAnswer: {
    findMany: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({ id: 'answer-1' }),
    delete: jest.fn().mockResolvedValue({ id: 'answer-1' }),
  },
});

describe('comment cache', () => {
  let publicContentCache: { invalidateComments: jest.Mock };
  let prisma: ReturnType<typeof createPrisma>;
  let comments: CommentService;
  let ratingSystem: RatingSystemService;

  beforeEach(() => {
    publicContentCache = {
      invalidateComments: jest.fn().mockResolvedValue(undefined),
    };
    prisma = createPrisma();
    comments = new CommentService(
      prisma as any,
      { settingByName: jest.fn().mockResolvedValue({ value: 1000 }) } as any,
      {} as any,
      publicContentCache as any
    );
    ratingSystem = new RatingSystemService(
      prisma as any,
      publicContentCache as any
    );
    jest.spyOn(comments, 'getComment').mockResolvedValue({} as any);
  });

  it.each<[string, () => Promise<unknown>]>([
    [
      'an editor writes a comment',
      () =>
        comments.createAdminComment({
          itemID: 'article-1',
          itemType: 'article',
          text: [],
        } as any),
    ],
    [
      'an editor changes a comment',
      () => comments.updateAdminComment({ id: 'comment-1' } as any),
    ],
    ['a comment is deleted', () => comments.deleteComment('comment-1')],
    [
      'a comment is approved or rejected',
      () =>
        comments.takeActionOnComment('comment-1', {
          state: CommentState.approved,
          rejectionReason: null,
        }),
    ],
    [
      'a reader writes a comment',
      () =>
        comments.addUserComment(
          {
            itemID: 'article-1',
            itemType: 'article',
            text: { type: 'doc', content: [] },
          } as any,
          session
        ),
    ],
    [
      'a reader changes a comment',
      () => comments.updateUserComment({ id: 'comment-1' } as any, session),
    ],
    [
      'the rating system changes',
      () => ratingSystem.updateRatingSystem({ id: 'system-1' } as any),
    ],
    [
      'a rating answer is added',
      () =>
        ratingSystem.createRatingSystemAnswer({
          ratingSystemId: 'system-1',
        } as any),
    ],
    [
      'a rating answer is removed',
      () => ratingSystem.deleteRatingSystemAnswer('answer-1'),
    ],
  ])('clears cached comment answers after %s', async (_, change) => {
    await change();

    expect(publicContentCache.invalidateComments).toHaveBeenCalled();
  });
});
