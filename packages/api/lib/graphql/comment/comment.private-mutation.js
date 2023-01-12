"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteComment = exports.createAdminComment = exports.updateComment = exports.takeActionOnComment = void 0;
const client_1 = require("@prisma/client");
const error_1 = require("../../error");
const comment_rating_public_mutation_1 = require("../comment-rating/comment-rating.public-mutation");
const permissions_1 = require("../permissions");
const takeActionOnComment = (id, input, authenticate, comment) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanTakeActionOnComment, roles);
    return comment.update({
        where: { id },
        data: input,
        include: {
            revisions: { orderBy: { createdAt: 'asc' } }
        }
    });
};
exports.takeActionOnComment = takeActionOnComment;
const updateComment = async (commentId, revision, userID, guestUsername, guestUserImageID, source, tagIds, ratingOverrides, authenticate, commentRatingAnswerClient, commentClient) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanUpdateComments, roles);
    if (ratingOverrides === null || ratingOverrides === void 0 ? void 0 : ratingOverrides.length) {
        const answerIds = ratingOverrides.map(override => override.answerId);
        const answers = await commentRatingAnswerClient.findMany({
            where: {
                id: {
                    in: answerIds
                }
            }
        });
        ratingOverrides.forEach(override => {
            var _a;
            const answer = answers.find(a => a.id === override.answerId);
            if (!answer) {
                throw new error_1.NotFound('CommentRatingSystemAnswer', override.answerId);
            }
            (0, comment_rating_public_mutation_1.validateCommentRatingValue)(answer.type, (_a = override.value) !== null && _a !== void 0 ? _a : 0);
        });
    }
    return commentClient.update({
        where: { id: commentId },
        data: {
            userID,
            guestUsername,
            guestUserImageID,
            source,
            revisions: revision
                ? {
                    create: {
                        text: revision.text,
                        title: revision.title,
                        lead: revision.lead
                    }
                }
                : undefined,
            tags: tagIds
                ? {
                    connectOrCreate: tagIds.map(tagId => ({
                        where: {
                            commentId_tagId: {
                                commentId,
                                tagId
                            }
                        },
                        create: {
                            tagId
                        }
                    })),
                    deleteMany: {
                        commentId,
                        tagId: {
                            notIn: tagIds
                        }
                    }
                }
                : undefined,
            overriddenRatings: {
                upsert: ratingOverrides === null || ratingOverrides === void 0 ? void 0 : ratingOverrides.map(override => {
                    var _a;
                    return ({
                        where: {
                            answerId_commentId: {
                                answerId: override.answerId,
                                commentId
                            }
                        },
                        create: {
                            answerId: override.answerId,
                            value: override.value
                        },
                        update: {
                            value: (_a = override.value) !== null && _a !== void 0 ? _a : null
                        }
                    });
                })
            }
        },
        include: {
            revisions: { orderBy: { createdAt: 'asc' } },
            overriddenRatings: true
        }
    });
};
exports.updateComment = updateComment;
const createAdminComment = async (itemId, itemType, parentID, text, tagIds, authenticate, commentClient) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanUpdateComments, roles);
    return commentClient.create({
        data: {
            state: client_1.CommentState.pendingApproval,
            authorType: client_1.CommentAuthorType.team,
            itemID: itemId,
            itemType,
            parentID,
            revisions: text
                ? {
                    create: {
                        text
                    }
                }
                : undefined,
            tags: {
                create: tagIds === null || tagIds === void 0 ? void 0 : tagIds.map(tagId => ({
                    tagId
                }))
            }
        },
        include: {
            revisions: { orderBy: { createdAt: 'asc' } }
        }
    });
};
exports.createAdminComment = createAdminComment;
const deleteComment = async (id, authenticate, commentClient) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanDeleteComments, roles);
    return commentClient.delete({
        where: {
            id
        }
    });
};
exports.deleteComment = deleteComment;
//# sourceMappingURL=comment.private-mutation.js.map