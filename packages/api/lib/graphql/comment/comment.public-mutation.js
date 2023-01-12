"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePublicComment = exports.addPublicComment = void 0;
const client_1 = require("@prisma/client");
const setting_1 = require("../../db/setting");
const error_1 = require("../../error");
const utility_1 = require("../../utility");
const addPublicComment = async (input, optionalAuthenticateUser, challenge, settingsClient, commentClient) => {
    var _a;
    const user = optionalAuthenticateUser();
    let authorType = client_1.CommentAuthorType.verifiedUser;
    const commentLength = (0, utility_1.countRichtextChars)(0, input.text);
    if (commentLength > utility_1.MAX_COMMENT_LENGTH) {
        throw new error_1.CommentLengthError();
    }
    // Challenge
    if (!user) {
        authorType = client_1.CommentAuthorType.guestUser;
        const guestCanCommentSetting = await settingsClient.findUnique({
            where: { name: setting_1.SettingName.ALLOW_GUEST_COMMENTING }
        });
        const guestCanComment = (_a = guestCanCommentSetting === null || guestCanCommentSetting === void 0 ? void 0 : guestCanCommentSetting.value) !== null && _a !== void 0 ? _a : process.env.ENABLE_ANONYMOUS_COMMENTS === 'true';
        if (!guestCanComment) {
            throw new error_1.AnonymousCommentsDisabledError();
        }
        if (!input.guestUsername)
            throw new error_1.AnonymousCommentError();
        if (!input.challenge)
            throw new error_1.ChallengeMissingCommentError();
        const challengeValidationResult = await challenge.validateChallenge({
            challengeID: input.challenge.challengeID,
            solution: input.challenge.challengeSolution
        });
        if (!challengeValidationResult.valid)
            throw new error_1.CommentAuthenticationError(challengeValidationResult.message);
    }
    if (input.itemType === client_1.CommentItemType.peerArticle && !input.peerId) {
        throw new error_1.PeerIdMissingCommentError();
    }
    // Cleanup
    const { challenge: _, title, text } = input, commentInput = __rest(input, ["challenge", "title", "text"]);
    const comment = await commentClient.create({
        data: Object.assign(Object.assign({}, commentInput), { revisions: {
                create: {
                    text,
                    title
                }
            }, userID: user === null || user === void 0 ? void 0 : user.user.id, authorType, state: client_1.CommentState.pendingApproval })
    });
    return Object.assign(Object.assign({}, comment), { title, text });
};
exports.addPublicComment = addPublicComment;
const updatePublicComment = async (input, authenticateUser, commentClient) => {
    const { user } = authenticateUser();
    const comment = await commentClient.findUnique({
        where: {
            id: input.id
        }
    });
    if (!comment)
        return null;
    if (user.id !== (comment === null || comment === void 0 ? void 0 : comment.userID)) {
        throw new error_1.NotAuthorisedError();
    }
    else if (comment.state !== client_1.CommentState.pendingUserChanges) {
        throw new error_1.UserInputError('Comment state must be pending user changes');
    }
    const { id, text } = input;
    const updatedComment = await commentClient.update({
        where: { id },
        data: {
            revisions: {
                create: {
                    text
                }
            },
            state: client_1.CommentState.pendingApproval
        }
    });
    return Object.assign(Object.assign({}, updatedComment), { text });
};
exports.updatePublicComment = updatePublicComment;
//# sourceMappingURL=comment.public-mutation.js.map