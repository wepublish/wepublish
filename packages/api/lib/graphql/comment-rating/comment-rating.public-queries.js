"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userCommentRating = exports.getRatingSystem = void 0;
const getRatingSystem = (commentRatingSystem) => {
    return commentRatingSystem.findFirst({
        include: {
            answers: true
        }
    });
};
exports.getRatingSystem = getRatingSystem;
const userCommentRating = async (commentId, authenticateUser, commentRating) => {
    const { user } = authenticateUser();
    return await commentRating.findMany({
        where: {
            commentId,
            userId: user.id
        },
        include: {
            answer: true
        }
    });
};
exports.userCommentRating = userCommentRating;
//# sourceMappingURL=comment-rating.public-queries.js.map