import { PollAnswer, PollExternalVoteSource, PrismaClient, Poll, PollExternalVote, Prisma } from '@prisma/client';
import { Context } from '../../context';
export declare type FullPoll = Poll & {
    answers: (PollAnswer & {
        _count: Prisma.PollAnswerCountOutputType;
    })[];
    externalVoteSources: (PollExternalVoteSource & {
        voteAmounts: PollExternalVote[];
    })[];
};
export declare const getPoll: (id: string, poll: PrismaClient['poll']) => Promise<FullPoll | null>;
export declare const userPollVote: (pollId: string, authenticateUser: Context['authenticateUser'], pollVote: PrismaClient['pollVote']) => Promise<string | undefined>;
//# sourceMappingURL=poll.public-queries.d.ts.map