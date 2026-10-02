import { Test } from '@nestjs/testing';
import { CommentItemType, CommentState } from '@prisma/client';
import {
  KvTtlCacheModule,
  KvTtlCacheService,
  PublicContentCacheInvalidator,
} from '@wepublish/kv-ttl-cache/api';
import { CanGetComments } from '@wepublish/permissions';
import { SortOrder } from '@wepublish/utils/api';
import { CommentSort, CommentsForItemArgs } from './comment.model';
import { CommentResolver } from './comment.resolver';
import { CommentService, DecoratedComment } from './comment.service';

const answer = {
  id: 'answer-1',
  answer: 'Quality',
  type: 'star',
  ratingSystemId: 'system-1',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  modifiedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const comment = (
  id: string,
  {
    itemID = 'article-1',
    ...overrides
  }: Partial<Record<string, unknown>> & { itemID?: string } = {}
) => ({
  id,
  itemID,
  itemType: CommentItemType.article,
  parentID: null,
  state: CommentState.approved,
  userID: 'author-1',
  guestUsername: null,
  guestUserImageID: null,
  createdAt: new Date(`2026-01-01T00:00:0${id.slice(-1)}.000Z`),
  modifiedAt: new Date(`2026-01-01T00:00:0${id.slice(-1)}.000Z`),
  revisions: [
    { id: `${id}-r1`, text: 'first', title: null, lead: null },
    { id: `${id}-r2`, text: 'latest', title: null, lead: null },
  ],
  overriddenRatings: [],
  ...overrides,
});

const rating = (
  id: string,
  commentId: string,
  userId: string,
  value: number
) => ({
  id,
  commentId,
  answerId: answer.id,
  userId,
  fingerprint: `fingerprint-of-${userId}`,
  value,
  disabled: false,
  answer,
});

const fixture = () => ({
  comments: [
    comment('c1'),
    comment('c2', { state: CommentState.pendingApproval, userID: 'reader-1' }),
    comment('c3', { state: CommentState.rejected, userID: 'reader-2' }),
    comment('c4', {
      state: CommentState.pendingApproval,
      userID: 'reader-1',
      parentID: 'c1',
    }),
    comment('c5', { itemID: 'article-2' }),
  ],
  ratings: [
    rating('rating-1', 'c1', 'reader-1', 4),
    rating('rating-2', 'c1', 'reader-2', 2),
  ],
});

type Fixture = ReturnType<typeof fixture>;
type FixtureComment = Fixture['comments'][number];

const matches = (
  candidate: FixtureComment,
  where: Record<string, any>
): boolean =>
  candidate.itemID === where['itemID'] &&
  candidate.itemType === where['itemType'] &&
  (where['userID'] === undefined || candidate.userID === where['userID']) &&
  (where['state'] === undefined ||
    (typeof where['state'] === 'string' ?
      candidate.state === where['state']
    : candidate.state !== where['state'].not));

const createPrisma = ({ comments, ratings }: Fixture) => ({
  comment: {
    findMany: jest.fn(async ({ where }: { where: Record<string, any> }) =>
      comments
        .filter(candidate => matches(candidate, where))
        .map(candidate => ({
          ...candidate,
          ratings: ratings.filter(
            ({ commentId }) => commentId === candidate.id
          ),
        }))
    ),
    findUnique: jest.fn(
      async ({ where }: { where: { id: string } }) =>
        comments.find(({ id }) => id === where.id) ?? null
    ),
  },
  commentRating: {
    findMany: jest.fn(
      async ({
        where,
      }: {
        where: { userId: string; comment: Record<string, unknown> };
      }) =>
        ratings.filter(
          ({ userId, commentId }) =>
            userId === where.userId &&
            comments.some(
              candidate =>
                candidate.id === commentId && matches(candidate, where.comment)
            )
        )
    ),
    upsert: jest.fn(async ({ create }: { create: Record<string, any> }) => {
      ratings.push({
        ...rating('rating-new', create['commentId'], create['userId'], 5),
        value: create['value'],
      });

      return create;
    }),
  },
  commentRatingSystemAnswer: {
    findMany: jest.fn(async () => [answer]),
    findUnique: jest.fn(async () => answer),
  },
});

const args = (
  itemId = 'article-1',
  sort = CommentSort.Rating
): CommentsForItemArgs => ({
  itemId,
  itemType: CommentItemType.article,
  sort,
  order: SortOrder.Descending,
});

const ids = (comments: DecoratedComment[]) => comments.map(({ id }) => id);

describe('commentsForItem cache', () => {
  let kv: KvTtlCacheService;
  let data: Fixture;
  let prisma: ReturnType<typeof createPrisma>;

  const service = () =>
    new CommentService(
      prisma as any,
      { settingByName: jest.fn().mockResolvedValue({ value: true }) } as any,
      {} as any,
      new PublicContentCacheInvalidator(kv),
      kv
    );

  const approvedQueries = (itemID = 'article-1') =>
    prisma.comment.findMany.mock.calls.filter(
      ([{ where }]) =>
        where['itemID'] === itemID && where['state'] === CommentState.approved
    ).length;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [KvTtlCacheModule],
    }).compile();
    kv = module.get(KvTtlCacheService);
    data = fixture();
    prisma = createPrisma(data);
  });

  it('loads the approved comments of an article once for every reader', async () => {
    await service().getPublicCommentsForItem(args());
    await service().getPublicCommentsForItem(args(), 'reader-1');
    await service().getPublicCommentsForItem(args(), 'reader-2');

    expect(approvedQueries()).toBe(1);
  });

  it('shows anonymous readers only approved comments', async () => {
    const comments = await service().getPublicCommentsForItem(args());

    expect(ids(comments)).toEqual(['c1']);
    expect(ids(comments[0].children)).toEqual([]);
  });

  it('shows a reader their own comments that are not approved yet, nested where they belong', async () => {
    await service().getPublicCommentsForItem(args());

    const readerOne = await service().getPublicCommentsForItem(
      args(),
      'reader-1'
    );
    const readerTwo = await service().getPublicCommentsForItem(
      args(),
      'reader-2'
    );

    expect(ids(readerOne).sort()).toEqual(['c1', 'c2']);
    expect(ids(readerOne.find(({ id }) => id === 'c1')!.children)).toEqual([
      'c4',
    ]);
    expect(ids(readerTwo).sort()).toEqual(['c1', 'c3']);
  });

  it('counts the ratings of the cached comments', async () => {
    await service().getPublicCommentsForItem(args());
    const [cached] = await service().getPublicCommentsForItem(args());

    expect(cached.calculatedRatings).toEqual([
      expect.objectContaining({ count: 2, mean: 3, total: 6 }),
    ]);
  });

  it("keeps raters' ids and fingerprints out of the cache", async () => {
    const cacheSpy = jest.spyOn(kv, 'getOrLoadNs');

    await service().getPublicCommentsForItem(args(), 'reader-1');
    const cached = JSON.stringify(await cacheSpy.mock.calls[0][2]());

    expect(cached).not.toContain('fingerprint-of');
    expect(cached).not.toContain('reader-2');
  });

  it('gives a logged-in reader their own ratings and nobody else theirs', async () => {
    const [anonymous] = await service().getPublicCommentsForItem(args());
    const readerOne = await service().getPublicCommentsForItem(
      args(),
      'reader-1'
    );

    expect(anonymous.ratings).toEqual([]);
    expect(
      readerOne.find(({ id }) => id === 'c1')!.ratings.map(({ id }) => id)
    ).toEqual(['rating-1']);
  });

  it('serves the latest revision of a cached comment', async () => {
    await service().getPublicCommentsForItem(args());
    const [cached] = await service().getPublicCommentsForItem(args());

    expect(cached.revisions.at(-1)?.text).toBe('latest');
  });

  it.each<[string, (invalidator: PublicContentCacheInvalidator) => unknown]>([
    [
      'an editor changed comments',
      invalidator => invalidator.invalidateComments(),
    ],
    [
      'a reader changed comments',
      invalidator => invalidator.invalidateReaderComments(),
    ],
  ])('loads them again after %s', async (_, change) => {
    await service().getPublicCommentsForItem(args());
    await new Promise(resolve => setTimeout(resolve, 2));
    await change(new PublicContentCacheInvalidator(kv));
    await service().getPublicCommentsForItem(args());

    expect(approvedQueries()).toBe(2);
  });

  it('clears only the comments of the rated article after a rating', async () => {
    await service().getPublicCommentsForItem(args());
    await service().getPublicCommentsForItem(args('article-2'));

    await service().rateComment('c1', answer.id, 5, 'fingerprint', {
      user: { id: 'reader-3' },
    } as any);

    const [rated] = await service().getPublicCommentsForItem(args());
    await service().getPublicCommentsForItem(args('article-2'));

    expect(rated.calculatedRatings[0].count).toBe(3);
    expect(approvedQueries()).toBe(2);
    expect(approvedQueries('article-2')).toBe(1);
  });
});

describe('commentsForItem resolver', () => {
  const resolver = (commentService: Partial<CommentService>) =>
    new CommentResolver(
      ...([commentService] as unknown as ConstructorParameters<
        typeof CommentResolver
      >)
    );

  it('serves readers the cached public comments', async () => {
    const commentService = {
      getPublicCommentsForItem: jest.fn().mockResolvedValue([]),
      getCommentsForItem: jest.fn(),
    };

    await resolver(commentService).commentsForItem(args(), {
      user: { id: 'reader-1' },
      roles: [],
    } as any);
    await resolver(commentService).commentsForItem(args(), null);

    expect(commentService.getPublicCommentsForItem.mock.calls).toEqual([
      [args(), 'reader-1'],
      [args(), undefined],
    ]);
    expect(commentService.getCommentsForItem).not.toHaveBeenCalled();
  });

  it('serves editors every comment straight from the database', async () => {
    const commentService = {
      getPublicCommentsForItem: jest.fn(),
      getCommentsForItem: jest.fn().mockResolvedValue([]),
    };

    await resolver(commentService).commentsForItem(args(), {
      user: { id: 'editor-1' },
      roles: [{ id: 'editor', permissionIDs: [CanGetComments.id] }],
    } as any);

    expect(commentService.getCommentsForItem).toHaveBeenCalledWith(args());
    expect(commentService.getPublicCommentsForItem).not.toHaveBeenCalled();
  });
});
