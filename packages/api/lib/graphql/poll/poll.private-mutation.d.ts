import { Prisma, PrismaClient } from '@prisma/client';
import { Context } from '../../context';
export declare const deletePoll: (pollId: string, authenticate: Context['authenticate'], poll: PrismaClient['poll']) => Prisma.Prisma__PollClient<import(".prisma/client").Poll & {
    answers: (import(".prisma/client").PollAnswer & {
        _count: Prisma.PollAnswerCountOutputType;
    })[];
    externalVoteSources: (import(".prisma/client").PollExternalVoteSource & {
        voteAmounts: import(".prisma/client").PollExternalVote[];
    })[];
}>;
export declare const createPoll: (input: Pick<Prisma.PollUncheckedCreateInput, 'question' | 'opensAt' | 'closedAt'>, authenticate: Context['authenticate'], poll: PrismaClient['poll']) => Prisma.Prisma__PollClient<import(".prisma/client").Poll & {
    answers: import(".prisma/client").PollAnswer[];
}>;
declare type UpdatePollPollInput = Pick<Prisma.PollUncheckedCreateInput, 'question' | 'opensAt' | 'closedAt'>;
declare type UpdatePollAnswer = {
    id: string;
    answer: string;
};
declare type UpdatePollExternalVoteAmount = {
    id: string;
    amount: number;
};
declare type UpdatePollExternalVoteSource = {
    id: string;
    source: string;
    voteAmounts: UpdatePollExternalVoteAmount[] | undefined;
};
export declare const updatePoll: (pollId: string, pollInput: UpdatePollPollInput, answers: UpdatePollAnswer[] | undefined, externalVoteSources: UpdatePollExternalVoteSource[] | undefined, authenticate: Context['authenticate'], poll: PrismaClient['poll']) => Prisma.Prisma__PollClient<import(".prisma/client").Poll & {
    answers: (import(".prisma/client").PollAnswer & {
        _count: Prisma.PollAnswerCountOutputType;
    })[];
    externalVoteSources: (import(".prisma/client").PollExternalVoteSource & {
        voteAmounts: import(".prisma/client").PollExternalVote[];
    })[];
}>;
export declare const createPollAnswer: (pollId: string, answer: string, authenticate: Context['authenticate'], pollExternalVoteSource: PrismaClient['pollExternalVoteSource'], pollAnswer: PrismaClient['pollAnswer']) => Promise<import(".prisma/client").PollAnswer>;
export declare const deletePollAnswer: (answerId: string, authenticate: Context['authenticate'], pollAnswer: PrismaClient['pollAnswer']) => Promise<import(".prisma/client").PollAnswer & {
    _count: Prisma.PollAnswerCountOutputType;
}>;
export declare const createPollExternalVoteSource: (pollId: string, voteSource: string, authenticate: Context['authenticate'], pollAnswer: PrismaClient['pollAnswer'], pollExternalVoteSource: PrismaClient['pollExternalVoteSource']) => Promise<import(".prisma/client").PollExternalVoteSource & {
    voteAmounts: import(".prisma/client").PollExternalVote[];
}>;
export declare const deletePollExternalVoteSource: (sourceId: string, authenticate: Context['authenticate'], pollExternalVoteSource: PrismaClient['pollExternalVoteSource']) => Prisma.Prisma__PollExternalVoteSourceClient<import(".prisma/client").PollExternalVoteSource & {
    voteAmounts: import(".prisma/client").PollExternalVote[];
}>;
export {};
//# sourceMappingURL=poll.private-mutation.d.ts.map