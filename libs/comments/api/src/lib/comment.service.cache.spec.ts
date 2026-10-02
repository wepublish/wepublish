import { CommentItemType, CommentState } from '@prisma/client';
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
  article: {
    findUnique: jest.fn().mockResolvedValue({ id: 'article-1', slug: 'one' }),
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
  let publicContentCache: {
    invalidateComments: jest.Mock;
    invalidateReaderComments: jest.Mock;
  };
  let prisma: ReturnType<typeof createPrisma>;
  let comments: CommentService;
  let ratingSystem: RatingSystemService;

  beforeEach(() => {
    publicContentCache = {
      invalidateComments: jest.fn().mockResolvedValue(undefined),
      invalidateReaderComments: jest.fn().mockResolvedValue(undefined),
    };
    prisma = createPrisma();
    comments = new CommentService(
      prisma as any,
      { settingByName: jest.fn().mockResolvedValue({ value: 1000 }) } as any,
      {} as any,
      publicContentCache as any,
      {} as any
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

  it.each<[string, () => Promise<unknown>]>([
    [
      'an editor changes a comment',
      () => comments.updateAdminComment({ id: 'comment-1' } as any),
    ],
    ['a comment is deleted', () => comments.deleteComment('comment-1')],
    [
      'a comment is rejected',
      () =>
        comments.takeActionOnComment('comment-1', {
          state: CommentState.rejected,
          rejectionReason: 'spam',
        } as any),
    ],
  ])(
    'also clears article and page answers after %s, since comment blocks show it',
    async (_, change) => {
      await change();

      expect(publicContentCache.invalidateComments).toHaveBeenCalledWith(true);
    }
  );

  describe('on an article', () => {
    const commentOn = (itemType: CommentItemType) => {
      const comment = { id: 'comment-1', itemID: 'article-1', itemType };
      prisma.comment.update.mockResolvedValue(comment);
      prisma.comment.delete.mockResolvedValue(comment);
    };

    it.each<[string, () => Promise<unknown>]>([
      [
        'an editor changes a comment',
        () => comments.updateAdminComment({ id: 'comment-1' } as any),
      ],
      ['a comment is deleted', () => comments.deleteComment('comment-1')],
      [
        'a comment is rejected',
        () =>
          comments.takeActionOnComment('comment-1', {
            state: CommentState.rejected,
            rejectionReason: 'spam',
          } as any),
      ],
    ])(
      'tells the websites to rebuild the article page after %s',
      async (_, change) => {
        commentOn(CommentItemType.article);

        await change();

        expect(publicContentCache.invalidateComments).toHaveBeenCalledWith(
          true,
          { id: 'article-1', slug: 'one' }
        );
      }
    );

    it('tells the websites to rebuild only the article page after a comment is approved, since browsers show the comments of the html', async () => {
      commentOn(CommentItemType.article);

      await comments.takeActionOnComment('comment-1', {
        state: CommentState.approved,
        rejectionReason: null,
      });

      expect(publicContentCache.invalidateComments).toHaveBeenCalledWith(
        false,
        { id: 'article-1', slug: 'one' }
      );
    });

    it('tells the websites to rebuild the article page after an editor publishes a comment on it', async () => {
      prisma.comment.create.mockResolvedValue({
        id: 'comment-1',
        itemID: 'article-1',
        itemType: CommentItemType.article,
      });

      await comments.createAdminComment({
        itemID: 'article-1',
        itemType: CommentItemType.article,
        text: [],
        publish: true,
      } as any);

      expect(publicContentCache.invalidateComments).toHaveBeenCalledWith(
        false,
        { id: 'article-1', slug: 'one' }
      );
    });

    it('leaves the article page alone while an editor comment waits for approval', async () => {
      prisma.comment.create.mockResolvedValue({
        id: 'comment-1',
        itemID: 'article-1',
        itemType: CommentItemType.article,
      });

      await comments.createAdminComment({
        itemID: 'article-1',
        itemType: CommentItemType.article,
        text: [],
        publish: false,
      } as any);

      expect(publicContentCache.invalidateComments).toHaveBeenCalledWith(false);
      expect(prisma.article.findUnique).not.toHaveBeenCalled();
    });

    it('names no article page for a comment on a page', async () => {
      commentOn(CommentItemType.page);

      await comments.deleteComment('comment-1');

      expect(publicContentCache.invalidateComments).toHaveBeenCalledWith(true);
      expect(prisma.article.findUnique).not.toHaveBeenCalled();
    });

    it('names no article page once the article is gone', async () => {
      commentOn(CommentItemType.article);
      prisma.article.findUnique.mockResolvedValue(null);

      await comments.deleteComment('comment-1');

      expect(publicContentCache.invalidateComments).toHaveBeenCalledWith(true);
    });
  });

  it.each<[string, () => Promise<unknown>]>([
    [
      'a comment is approved',
      () =>
        comments.takeActionOnComment('comment-1', {
          state: CommentState.approved,
          rejectionReason: null,
        }),
    ],
  ])('clears only comment answers after %s', async (_, change) => {
    await change();

    expect(publicContentCache.invalidateComments).toHaveBeenCalledWith(false);
  });

  it.each<[string, () => Promise<unknown>, boolean]>([
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
      false,
    ],
    [
      'a reader changes a comment',
      () => comments.updateUserComment({ id: 'comment-1' } as any, session),
      true,
    ],
  ])('never lets %s rebuild the website pages', async (_, change, removed) => {
    await change();

    expect(publicContentCache.invalidateReaderComments).toHaveBeenCalledWith(
      removed
    );
    expect(publicContentCache.invalidateComments).not.toHaveBeenCalled();
  });
});
