import { Test } from '@nestjs/testing';
import {
  KvTtlCacheModule,
  KvTtlCacheService,
  PUBLIC_CONTENT_NAMESPACE,
  PublicContentCacheInvalidator,
} from '@wepublish/kv-ttl-cache/api';
import { PollDataloaderService } from './poll-dataloader.service';
import { PollService } from './poll.service';
import { PollVoteService } from './poll-vote.service';

vi.mock('./poll.model', () => ({
  PollSort: {
    CreatedAt: 'CreatedAt',
    ModifiedAt: 'ModifiedAt',
    OpensAt: 'OpensAt',
  },
}));
vi.mock('./poll-answer.model', () => ({}));
vi.mock('./poll-vote.model', () => ({
  PollVoteSort: { CreatedAt: 'CreatedAt' },
}));
vi.mock('@wepublish/settings/api', () => ({
  SettingName: { ALLOW_GUEST_POLL_VOTING: 'allowGuestPollVoting' },
  SettingsService: class {},
}));

const poll = (id: string) => ({
  id,
  question: 'Question',
  opensAt: new Date('2026-01-01T00:00:00.000Z'),
  closedAt: null,
  answers: [
    {
      id: `${id}-answer`,
      pollId: id,
      answer: 'Yes',
      _count: { votes: 3 },
    },
  ],
  externalVoteSources: [],
});

describe('poll content cache', () => {
  let kv: KvTtlCacheService;
  let prisma: ReturnType<typeof createPrisma>;

  const createPrisma = () => ({
    poll: {
      findMany: vi.fn(async ({ where }: { where: { id: { in: string[] } } }) =>
        where.id.in.map(poll)
      ),
      update: vi.fn(async () => poll('poll-1')),
      delete: vi.fn(async () => poll('poll-1')),
    },
    pollAnswer: {
      findUnique: vi.fn(async () => ({
        id: 'poll-1-answer',
        poll: { ...poll('poll-1'), answers: [{}, {}] },
      })),
      findMany: vi.fn(async () => []),
      create: vi.fn(async () => ({ id: 'poll-1-new' })),
      delete: vi.fn(async () => ({ id: 'poll-1-answer' })),
    },
    pollExternalVoteSource: {
      findMany: vi.fn(async () => []),
      create: vi.fn(async () => ({ id: 'source-1' })),
      delete: vi.fn(async () => ({ id: 'source-1' })),
    },
    pollVote: {
      upsert: vi.fn(async () => ({ id: 'vote-1' })),
      deleteMany: vi.fn(async () => ({ count: 1 })),
    },
  });

  const load = (id: string) =>
    new PollDataloaderService(prisma as any, kv).load(id);

  const loads = (id: string) =>
    prisma.poll.findMany.mock.calls.filter(([{ where }]) =>
      where.id.in.includes(id)
    ).length;

  const pollService = () =>
    Object.assign(
      new PollService(prisma as any, new PublicContentCacheInvalidator(kv)),
      { __DATALOADER__PollDataloaderService: { prime: vi.fn() } }
    );

  const pollVoteService = () =>
    new PollVoteService(
      { settingByName: vi.fn().mockResolvedValue({ value: true }) } as any,
      prisma as any,
      kv,
      new PublicContentCacheInvalidator(kv)
    );

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [KvTtlCacheModule],
    }).compile();
    kv = module.get(KvTtlCacheService);
    prisma = createPrisma();
  });

  it('loads a poll with its vote counts once across requests', async () => {
    await load('poll-1');
    const cached = await load('poll-1');

    expect(loads('poll-1')).toBe(1);
    expect(cached?.answers[0]._count.votes).toBe(3);
    expect(cached?.opensAt).toBeInstanceOf(Date);
  });

  it('counts a vote at once, without reloading other polls', async () => {
    await load('poll-1');
    await load('poll-2');

    await pollVoteService().voteOnPoll(
      'poll-1-answer',
      'fingerprint',
      'user-1'
    );
    await load('poll-1');
    await load('poll-2');

    expect(loads('poll-1')).toBe(2);
    expect(loads('poll-2')).toBe(1);
  });

  it.each<[string, () => Promise<unknown>]>([
    [
      'an editor changes a poll',
      () => pollService().updatePoll({ id: 'poll-1' } as any),
    ],
    ['a poll is deleted', () => pollService().deletePoll('poll-1')],
    [
      'an answer is added',
      () =>
        pollService().createPollAnswer({
          pollId: 'poll-1',
          answer: 'No',
        } as any),
    ],
    [
      'an answer is removed',
      () => pollService().deletePollAnswer('poll-1-answer'),
    ],
    [
      'an external vote source is added',
      () =>
        pollService().createPollExternalVoteSource({
          pollId: 'poll-1',
          source: 'print',
        } as any),
    ],
    [
      'an external vote source is removed',
      () => pollService().deletePollExternalVoteSource('source-1'),
    ],
    [
      'votes are deleted',
      () => pollVoteService().deletePollVotes({ ids: ['vote-1'] }),
    ],
  ])(
    'loads polls again and clears anonymous answers after %s',
    async (_, change) => {
      await load('poll-1');
      await new Promise(resolve => setTimeout(resolve, 2));
      const resetSpy = vi.spyOn(kv, 'resetNamespace');

      await change();
      await load('poll-1');

      expect(loads('poll-1')).toBe(2);
      expect(resetSpy.mock.calls.map(([namespace]) => namespace)).toContain(
        PUBLIC_CONTENT_NAMESPACE
      );
    }
  );
});
