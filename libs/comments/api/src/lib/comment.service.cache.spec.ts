import type { Mock } from 'vitest';
import { CommentItemType, CommentState } from '@prisma/client';
import { CanCreateApprovedComment } from '@wepublish/permissions';
import { CommentService } from './comment.service';
import { RatingSystemService } from './rating-system/rating-system.service';

const session = { user: { id: 'user-1' }, roles: [] } as any;
const approvedReader = {
  user: { id: 'user-1' },
  roles: [{ id: 'reader', permissionIDs: [CanCreateApprovedComment.id] }],
} as any;
const article = { id: 'article-1', slug: 'one' };
const ownComment = {
  id: 'comment-1',
  itemID: 'article-1',
  itemType: CommentItemType.article,
  userID: 'user-1',
  state: CommentState.pendingUserChanges,
  revisions: [],
};
const readerComment = {
  itemID: 'article-1',
  itemType: 'article',
  text: { type: 'doc', content: [] },
} as any;

const createPrisma = () => ({
  comment: {
    create: vi.fn().mockResolvedValue({ id: 'comment-1' }),
    update: vi.fn().mockResolvedValue({ id: 'comment-1' }),
    delete: vi.fn().mockResolvedValue({ id: 'comment-1' }),
    findUnique: vi.fn().mockResolvedValue({
      id: 'comment-1',
      userID: 'user-1',
      state: CommentState.pendingUserChanges,
      revisions: [],
    }),
  },
  article: {
    findUnique: vi.fn().mockResolvedValue({ id: 'article-1', slug: 'one' }),
  },
  commentRatingSystem: {
    update: vi.fn().mockResolvedValue({ id: 'system-1', answers: [] }),
  },
  commentRatingSystemAnswer: {
    findMany: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue({ id: 'answer-1' }),
    delete: vi.fn().mockResolvedValue({ id: 'answer-1' }),
  },
});

describe('comment cache', () => {
  let publicContentCache: {
    invalidateComments: Mock;
    invalidateReaderComments: Mock;
  };
  let prisma: ReturnType<typeof createPrisma>;
  let comments: CommentService;
  let ratingSystem: RatingSystemService;

  beforeEach(() => {
    publicContentCache = {
      invalidateComments: vi.fn().mockResolvedValue(undefined),
      invalidateReaderComments: vi.fn().mockResolvedValue(undefined),
    };
    prisma = createPrisma();
    comments = new CommentService(
      prisma as any,
      { settingByName: vi.fn().mockResolvedValue({ value: 1000 }) } as any,
      {} as any,
      publicContentCache as any,
      {} as any
    );
    ratingSystem = new RatingSystemService(
      prisma as any,
      publicContentCache as any
    );
    vi.spyOn(comments, 'getComment').mockResolvedValue({} as any);
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

    it.each([
      [false, []],
      [true, [{ id: 'article-1', slug: 'one' }]],
    ])(
      'also clears article and page answers when an editor writes a tagged comment (published: %s), since comment blocks select comments by tag',
      async (publish, articles) => {
        prisma.comment.create.mockResolvedValue({
          id: 'comment-1',
          itemID: 'article-1',
          itemType: CommentItemType.article,
        });

        await comments.createAdminComment({
          itemID: 'article-1',
          itemType: CommentItemType.article,
          text: [],
          tagIds: ['tag-1'],
          publish,
        } as any);

        expect(publicContentCache.invalidateComments).toHaveBeenCalledWith(
          true,
          ...articles
        );
      }
    );

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

  describe('reader comments', () => {
    beforeEach(() => {
      prisma.comment.create.mockResolvedValue(ownComment);
      prisma.comment.update.mockResolvedValue(ownComment);
      prisma.comment.findUnique.mockResolvedValue(ownComment);
    });

    it('leaves every public cache alone when a reader writes a comment that waits for approval', async () => {
      await comments.addUserComment(readerComment, session);

      expect(
        publicContentCache.invalidateReaderComments
      ).not.toHaveBeenCalled();
      expect(publicContentCache.invalidateComments).not.toHaveBeenCalled();
    });

    it('shows a reader comment that needs no approval at once and rebuilds only its article page', async () => {
      prisma.comment.create.mockResolvedValue({
        ...ownComment,
        state: CommentState.approved,
      });

      await comments.addUserComment(readerComment, approvedReader);

      expect(publicContentCache.invalidateReaderComments).toHaveBeenCalledWith(
        false,
        article
      );
      expect(publicContentCache.invalidateComments).not.toHaveBeenCalled();
    });

    it('refreshes comments, comment blocks and the article page when a reader edits a published comment', async () => {
      prisma.comment.findUnique.mockResolvedValue({
        ...ownComment,
        state: CommentState.approved,
      });

      await comments.updateUserComment({ id: 'comment-1' } as any, session);

      expect(publicContentCache.invalidateReaderComments).toHaveBeenCalledWith(
        true,
        article
      );
      expect(publicContentCache.invalidateComments).not.toHaveBeenCalled();
    });

    it('leaves public caches alone when a reader edits a comment nobody else sees yet', async () => {
      await comments.updateUserComment({ id: 'comment-1' } as any, session);

      expect(
        publicContentCache.invalidateReaderComments
      ).not.toHaveBeenCalled();
      expect(publicContentCache.invalidateComments).not.toHaveBeenCalled();
    });

    it('publishes an edit that needs no approval like an approval', async () => {
      prisma.comment.update.mockResolvedValue({
        ...ownComment,
        state: CommentState.approved,
      });

      await comments.updateUserComment(
        { id: 'comment-1' } as any,
        approvedReader
      );

      expect(publicContentCache.invalidateReaderComments).toHaveBeenCalledWith(
        false,
        article
      );
    });
  });
});
