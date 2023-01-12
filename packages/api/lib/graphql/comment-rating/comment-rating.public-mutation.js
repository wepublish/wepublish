"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateComment = exports.validateCommentRatingValue = void 0;
const client_1 = require("@prisma/client");
const error_1 = require("../../error");
const setting_1 = require("../../db/setting");
const validateCommentRatingValue = (type, value) => {
    switch (type) {
        case client_1.RatingSystemType.star: {
            if (value < 0 || value > 5) {
                throw new error_1.InvalidStarRatingValueError();
            }
        }
    }
};
exports.validateCommentRatingValue = validateCommentRatingValue;
const rateComment = async (commentId, answerId, value, fingerprint, optionalAuthenticateUser, commentRatingSystemAnswer, commentRating, settingsClient) => {
    var _a;
    const session = optionalAuthenticateUser();
    // check if anonymous rating is allowed
    const guestRatingSetting = await settingsClient.findUnique({
        where: {
            name: setting_1.SettingName.ALLOW_GUEST_COMMENT_RATING
        }
    });
    if (!session && (guestRatingSetting === null || guestRatingSetting === void 0 ? void 0 : guestRatingSetting.value) !== true) {
        throw new error_1.AnonymousCommentRatingDisabledError();
    }
    const answer = await commentRatingSystemAnswer.findUnique({
        where: {
            id: answerId
        }
    });
    if (!answer) {
        throw new error_1.NotFound('CommentRatingSystemAnswer', answerId);
    }
    (0, exports.validateCommentRatingValue)(answer.type, value);
    return commentRating.upsert({
        where: {
            answerId_commentId_userId: {
                answerId,
                commentId,
                userId: (_a = session === null || session === void 0 ? void 0 : session.user.id) !== null && _a !== void 0 ? _a : ''
            }
        },
        update: {
            fingerprint,
            value
        },
        create: {
            answerId,
            commentId,
            userId: session === null || session === void 0 ? void 0 : session.user.id,
            value,
            fingerprint
        }
    });
};
exports.rateComment = rateComment;
//# sourceMappingURL=comment-rating.public-mutation.js.map