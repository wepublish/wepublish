"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.voteOnPoll = void 0;
const error_1 = require("../../error");
const setting_1 = require("../../db/setting");
const voteOnPoll = async (answerId, fingerprint, optionalAuthenticateUser, pollAnswer, pollVote, settingsClient) => {
    var _a;
    const session = optionalAuthenticateUser();
    // check if anonymous vote on poll is allowed
    const guestVotingSetting = await settingsClient.findUnique({
        where: {
            name: setting_1.SettingName.ALLOW_GUEST_POLL_VOTING
        }
    });
    if (!session && (guestVotingSetting === null || guestVotingSetting === void 0 ? void 0 : guestVotingSetting.value) !== true) {
        throw new error_1.AnonymousPollVotingDisabledError();
    }
    const answer = await pollAnswer.findUnique({
        where: {
            id: answerId
        },
        include: {
            poll: true
        }
    });
    if (!answer) {
        throw new error_1.NotFound('PollAnswer', answerId);
    }
    const { poll } = answer;
    if (poll.opensAt > new Date()) {
        throw new error_1.PollNotOpenError();
    }
    if (poll.closedAt && poll.closedAt < new Date()) {
        throw new error_1.PollClosedError();
    }
    return pollVote.upsert({
        where: {
            pollId_userId: {
                pollId: poll.id,
                userId: (_a = session === null || session === void 0 ? void 0 : session.user.id) !== null && _a !== void 0 ? _a : ''
            }
        },
        update: {
            answerId,
            fingerprint
        },
        create: {
            answerId,
            fingerprint,
            pollId: poll.id,
            userId: session === null || session === void 0 ? void 0 : session.user.id
        }
    });
};
exports.voteOnPoll = voteOnPoll;
//# sourceMappingURL=poll.public-mutation.js.map