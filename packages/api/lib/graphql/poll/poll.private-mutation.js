"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePollExternalVoteSource = exports.createPollExternalVoteSource = exports.deletePollAnswer = exports.createPollAnswer = exports.updatePoll = exports.createPoll = exports.deletePoll = void 0;
const graphql_1 = require("graphql");
const error_1 = require("../../error");
const permissions_1 = require("../permissions");
const deletePoll = (pollId, authenticate, poll) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanDeletePoll, roles);
    return poll.delete({
        where: { id: pollId },
        include: {
            answers: {
                include: {
                    _count: true
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
exports.deletePoll = deletePoll;
const createPoll = (input, authenticate, poll) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanCreatePoll, roles);
    return poll.create({
        data: Object.assign(Object.assign({}, input), { answers: {
                createMany: {
                    data: [{ answer: '' }, { answer: '' }]
                }
            } }),
        include: {
            answers: true
        }
    });
};
exports.createPoll = createPoll;
const updatePoll = (pollId, pollInput, answers, externalVoteSources, authenticate, poll) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanUpdatePoll, roles);
    return poll.update({
        where: { id: pollId },
        data: Object.assign(Object.assign({}, pollInput), { answers: {
                update: answers === null || answers === void 0 ? void 0 : answers.map(answer => ({
                    where: { id: answer.id },
                    data: {
                        answer: answer.answer
                    }
                }))
            }, externalVoteSources: {
                update: externalVoteSources === null || externalVoteSources === void 0 ? void 0 : externalVoteSources.map(externalVoteSource => {
                    var _a;
                    return ({
                        where: { id: externalVoteSource.id },
                        data: {
                            source: externalVoteSource.source,
                            voteAmounts: {
                                update: (_a = externalVoteSource.voteAmounts) === null || _a === void 0 ? void 0 : _a.map(voteAmount => ({
                                    where: { id: voteAmount.id },
                                    data: {
                                        amount: voteAmount.amount
                                    }
                                }))
                            }
                        }
                    });
                })
            } }),
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
exports.updatePoll = updatePoll;
const createPollAnswer = async (pollId, answer, authenticate, pollExternalVoteSource, pollAnswer) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanUpdatePoll, roles);
    const voteSources = await pollExternalVoteSource.findMany({
        where: {
            pollId
        }
    });
    return pollAnswer.create({
        data: {
            answer,
            poll: {
                connect: {
                    id: pollId
                }
            },
            externalVotes: {
                createMany: {
                    data: voteSources.map(source => ({
                        sourceId: source.id
                    }))
                }
            }
        }
    });
};
exports.createPollAnswer = createPollAnswer;
const deletePollAnswer = async (answerId, authenticate, pollAnswer) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanUpdatePoll, roles);
    const answerWithPoll = await pollAnswer.findUnique({
        where: {
            id: answerId
        },
        include: {
            poll: {
                select: {
                    answers: true
                }
            }
        }
    });
    if (!answerWithPoll) {
        throw new error_1.NotFound('PollAnswer', answerId);
    }
    if (answerWithPoll.poll.answers.length <= 1) {
        throw new graphql_1.GraphQLError('A poll requires at least one answer.');
    }
    return pollAnswer.delete({
        where: { id: answerId },
        include: {
            _count: true
        }
    });
};
exports.deletePollAnswer = deletePollAnswer;
const createPollExternalVoteSource = async (pollId, voteSource, authenticate, pollAnswer, pollExternalVoteSource) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanUpdatePoll, roles);
    const answers = await pollAnswer.findMany({
        where: {
            pollId
        }
    });
    return pollExternalVoteSource.create({
        data: {
            source: voteSource,
            pollId,
            voteAmounts: {
                createMany: {
                    data: answers.map(answer => ({
                        answerId: answer.id
                    }))
                }
            }
        },
        include: {
            voteAmounts: true
        }
    });
};
exports.createPollExternalVoteSource = createPollExternalVoteSource;
const deletePollExternalVoteSource = (sourceId, authenticate, pollExternalVoteSource) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanUpdatePoll, roles);
    return pollExternalVoteSource.delete({
        where: { id: sourceId },
        include: {
            voteAmounts: true
        }
    });
};
exports.deletePollExternalVoteSource = deletePollExternalVoteSource;
//# sourceMappingURL=poll.private-mutation.js.map