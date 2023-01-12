"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userPollVote = exports.getPoll = void 0;
const getPoll = (id, poll) => {
    return poll.findUnique({
        where: { id },
        include: {
            answers: {
                include: {
                    _count: true
                },
                orderBy: {
                    createdAt: 'asc'
                }
            },
            externalVoteSources: {
                include: {
                    voteAmounts: true
                }
            }
        }
    });
};
exports.getPoll = getPoll;
const userPollVote = async (pollId, authenticateUser, pollVote) => {
    const { user } = authenticateUser();
    const vote = await pollVote.findUnique({
        where: {
            pollId_userId: {
                pollId,
                userId: user.id
            }
        }
    });
    return vote === null || vote === void 0 ? void 0 : vote.answerId;
};
exports.userPollVote = userPollVote;
//# sourceMappingURL=poll.public-queries.js.map