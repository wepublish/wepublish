import { PrismaClient } from '@prisma/client';
import { Context } from '../../context';
export declare const voteOnPoll: (answerId: string, fingerprint: string | undefined, optionalAuthenticateUser: Context['optionalAuthenticateUser'], pollAnswer: PrismaClient['pollAnswer'], pollVote: PrismaClient['pollVote'], settingsClient: PrismaClient['setting']) => Promise<import(".prisma/client").PollVote>;
//# sourceMappingURL=poll.public-mutation.d.ts.map