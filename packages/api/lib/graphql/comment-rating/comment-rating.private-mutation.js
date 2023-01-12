"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCommentRatingAnswer = exports.createCommentRatingAnswer = exports.updateRatingSystem = void 0;
const permissions_1 = require("../permissions");
const updateRatingSystem = (ratingSystemId, name, answers, authenticate, ratingSystem) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanUpdateCommentRatingSystem, roles);
    return ratingSystem.update({
        where: { id: ratingSystemId },
        data: {
            name,
            answers: {
                update: answers === null || answers === void 0 ? void 0 : answers.map(answer => ({
                    where: { id: answer.id },
                    data: {
                        answer: answer.answer
                    }
                }))
            }
        },
        include: {
            answers: true
        }
    });
};
exports.updateRatingSystem = updateRatingSystem;
const createCommentRatingAnswer = async (ratingSystemId, type, answer, authenticate, ratingAnswer) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanUpdateCommentRatingSystem, roles);
    return ratingAnswer.create({
        data: {
            type,
            answer,
            ratingSystem: {
                connect: {
                    id: ratingSystemId
                }
            }
        }
    });
};
exports.createCommentRatingAnswer = createCommentRatingAnswer;
const deleteCommentRatingAnswer = async (answerId, authenticate, commentRatingAnswer) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanUpdateCommentRatingSystem, roles);
    return commentRatingAnswer.delete({
        where: { id: answerId }
    });
};
exports.deleteCommentRatingAnswer = deleteCommentRatingAnswer;
//# sourceMappingURL=comment-rating.private-mutation.js.map