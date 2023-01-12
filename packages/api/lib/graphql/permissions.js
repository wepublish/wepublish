"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CanGetUserRole = exports.CanCreateUserRole = exports.CanDeleteUser = exports.CanGetUsers = exports.CanGetUser = exports.CanResetUserPassword = exports.CanCreateUser = exports.CanDeleteToken = exports.CanGetTokens = exports.CanCreateToken = exports.CanDeletePeer = exports.CanGetPeers = exports.CanGetPeer = exports.CanCreatePeer = exports.CanGetPeerProfile = exports.CanUpdatePeerProfile = exports.CanGetPagePreviewLink = exports.CanDeletePage = exports.CanPublishPage = exports.CanGetPages = exports.CanGetPage = exports.CanCreatePage = exports.CanDeleteComments = exports.CanUpdateComments = exports.CanGetComments = exports.CanTakeActionOnComment = exports.CanGetArticlePreviewLink = exports.CanDeleteArticle = exports.CanPublishArticle = exports.CanGetPeerArticles = exports.CanGetPeerArticle = exports.CanGetSharedArticles = exports.CanGetArticles = exports.CanGetSharedArticle = exports.CanGetArticle = exports.CanCreateArticle = exports.CanDeleteImage = exports.CanGetImages = exports.CanGetImage = exports.CanCreateImage = exports.CanDeleteAuthor = exports.CanGetAuthors = exports.CanGetAuthor = exports.CanCreateAuthor = exports.CanDeleteNavigation = exports.CanCreateNavigation = exports.CanGetNavigations = exports.CanGetNavigation = exports.isAuthorised = exports.authorise = void 0;
exports.PeerPermissions = exports.EditorPermissions = exports.AllPermissions = exports.CanDeletePoll = exports.CanUpdatePoll = exports.CanCreatePoll = exports.CanGetPoll = exports.CanDeleteTag = exports.CanGetTags = exports.CanUpdateTag = exports.CanCreateTag = exports.CanDeleteCommentRatingSystem = exports.CanUpdateCommentRatingSystem = exports.CanCreateCommentRatingSystem = exports.CanGetCommentRatingSystem = exports.CanUpdateSettings = exports.CanGetSettings = exports.CanLoginAsOtherUser = exports.CanDeleteSubscription = exports.CanGetSubscriptions = exports.CanGetSubscription = exports.CanCreateSubscription = exports.CanLoginEditor = exports.CanSendJWTLogin = exports.CanGetPaymentProviders = exports.CanGetPayments = exports.CanGetPayment = exports.CanCreatePayment = exports.CanDeleteInvoice = exports.CanGetInvoices = exports.CanGetInvoice = exports.CanCreateInvoice = exports.CanDeletePaymentMethod = exports.CanGetPaymentMethods = exports.CanGetPaymentMethod = exports.CanCreatePaymentMethod = exports.CanDeleteMemberPlan = exports.CanGetMemberPlans = exports.CanGetMemberPlan = exports.CanCreateMemberPlan = exports.CanGetPermissions = exports.CanGetPermission = exports.CanDeleteUserRole = exports.CanGetUserRoles = void 0;
const error_1 = require("../error");
function authorise(neededPermission, userRoles) {
    if (!isAuthorised(neededPermission, userRoles)) {
        throw new error_1.NotAuthorisedError();
    }
}
exports.authorise = authorise;
function isAuthorised(neededPermission, userRoles) {
    if (neededPermission.deprecated) {
        console.warn('Permission is deprecated', neededPermission);
    }
    const userPermissions = userRoles.reduce((permissions, role) => {
        if (role.id === 'admin') {
            return [...permissions, ...exports.AllPermissions.map(permission => permission.id)];
        }
        else if (role.id === 'editor') {
            return [...permissions, ...exports.EditorPermissions.map(permission => permission.id)];
        }
        else if (role.id === 'peer') {
            return [...permissions, ...exports.PeerPermissions.map(permission => permission.id)];
        }
        else {
            return [...permissions, ...role.permissionIDs];
        }
    }, []);
    return userPermissions.some(permission => permission === neededPermission.id);
}
exports.isAuthorised = isAuthorised;
exports.CanGetNavigation = {
    id: 'CAN_GET_NAVIGATION',
    description: 'Allows to get navigation',
    deprecated: false
};
exports.CanGetNavigations = {
    id: 'CAN_GET_NAVIGATIONS',
    description: 'Allows to get all navigations',
    deprecated: false
};
exports.CanCreateNavigation = {
    id: 'CAN_CREATE_NAVIGATION',
    description: 'Allows to create navigation',
    deprecated: false
};
exports.CanDeleteNavigation = {
    id: 'CAN_DELETE_NAVIGATION',
    description: 'Allows to delete navigations',
    deprecated: false
};
exports.CanCreateAuthor = {
    id: 'CAN_CREATE_AUTHOR',
    description: 'Allows to create authors',
    deprecated: false
};
exports.CanGetAuthor = {
    id: 'CAN_GET_AUTHOR',
    description: 'Allows to get author',
    deprecated: false
};
exports.CanGetAuthors = {
    id: 'CAN_GET_AUTHORS',
    description: 'Allows to all authors',
    deprecated: false
};
exports.CanDeleteAuthor = {
    id: 'CAN_DELETE_AUTHORS',
    description: 'Allows to delete authors',
    deprecated: false
};
exports.CanCreateImage = {
    id: 'CAN_CREATE_IMAGE',
    description: 'Allows to create images',
    deprecated: false
};
exports.CanGetImage = {
    id: 'CAN_GET_IMAGE',
    description: 'Allows to get image',
    deprecated: false
};
exports.CanGetImages = {
    id: 'CAN_GET_IMAGES',
    description: 'Allows to get all images',
    deprecated: false
};
exports.CanDeleteImage = {
    id: 'CAN_DELETE_IMAGE',
    description: 'Allows to delete images',
    deprecated: false
};
exports.CanCreateArticle = {
    id: 'CAN_CREATE_ARTICLE',
    description: 'Allows to create articles',
    deprecated: false
};
exports.CanGetArticle = {
    id: 'CAN_GET_ARTICLE',
    description: 'Allows to get article',
    deprecated: false
};
exports.CanGetSharedArticle = {
    id: 'CAN_GET_SHARED_ARTICLE',
    description: 'Allows to get shared article',
    deprecated: false
};
exports.CanGetArticles = {
    id: 'CAN_GET_ARTICLES',
    description: 'Allows to get all articles',
    deprecated: false
};
exports.CanGetSharedArticles = {
    id: 'CAN_GET_SHARED_ARTICLES',
    description: 'Allows to get shared articles',
    deprecated: false
};
exports.CanGetPeerArticle = {
    id: 'CAN_GET_PEER_ARTICLE',
    description: 'Allows to get peer article',
    deprecated: false
};
exports.CanGetPeerArticles = {
    id: 'CAN_GET_PEER_ARTICLES',
    description: 'Allows to get all peer articles',
    deprecated: false
};
exports.CanPublishArticle = {
    id: 'CAN_PUBLISH_ARTICLE',
    description: 'Allows to publish articles',
    deprecated: false
};
exports.CanDeleteArticle = {
    id: 'CAN_DELETE_ARTICLE',
    description: 'Allows to delete articles',
    deprecated: false
};
exports.CanGetArticlePreviewLink = {
    id: 'CAN_GET_ARTICLE_PREVIEW_LINK',
    description: 'Allows to get preview links for articles',
    deprecated: false
};
exports.CanTakeActionOnComment = {
    id: 'CAN_TAKE_COMMENT_ACTION',
    description: 'Allows to take an action on comment',
    deprecated: false
};
exports.CanGetComments = {
    id: 'CAN_GET_COMMENTS',
    description: 'Allows to get all comments',
    deprecated: false
};
exports.CanUpdateComments = {
    id: 'CAN_UPDATE_COMMENTS',
    description: 'Allows to update a comment',
    deprecated: false
};
exports.CanDeleteComments = {
    id: 'CAN_DELETE_COMMENTS',
    description: 'Allows to delete comments',
    deprecated: false
};
exports.CanCreatePage = {
    id: 'CAN_CREATE_PAGE',
    description: 'Allows to create Pages',
    deprecated: false
};
exports.CanGetPage = {
    id: 'CAN_GET_PAGE',
    description: 'Allows to get Page',
    deprecated: false
};
exports.CanGetPages = {
    id: 'CAN_GET_PAGES',
    description: 'Allows to get all Pages',
    deprecated: false
};
exports.CanPublishPage = {
    id: 'CAN_PUBLISH_PAGE',
    description: 'Allows to publish Pages',
    deprecated: false
};
exports.CanDeletePage = {
    id: 'CAN_DELETE_PAGE',
    description: 'Allows to delete Pages',
    deprecated: false
};
exports.CanGetPagePreviewLink = {
    id: 'CAN_GET_PAGE_PREVIEW_LINK',
    description: 'Allows to get preview links for pages',
    deprecated: false
};
exports.CanUpdatePeerProfile = {
    id: 'CAN_UPDATE_PEER_PROFILE',
    description: 'Allows to update peer profile',
    deprecated: false
};
exports.CanGetPeerProfile = {
    id: 'CAN_GET_PEER_PROFILE',
    description: 'Allows to get peer profile',
    deprecated: false
};
exports.CanCreatePeer = {
    id: 'CAN_CREATE_PEER',
    description: 'Allows to create peers',
    deprecated: false
};
exports.CanGetPeer = {
    id: 'CAN_GET_PEER',
    description: 'Allows to get peer',
    deprecated: false
};
exports.CanGetPeers = {
    id: 'CAN_GET_PEERS',
    description: 'Allows to get all peers',
    deprecated: false
};
exports.CanDeletePeer = {
    id: 'CAN_DELETE_PEER',
    description: 'Allows to delete peers',
    deprecated: false
};
exports.CanCreateToken = {
    id: 'CAN_CREATE_TOKEN',
    description: 'Allows to create tokens',
    deprecated: false
};
exports.CanGetTokens = {
    id: 'CAN_GET_TOKENS',
    description: 'Allows to get all tokens',
    deprecated: false
};
exports.CanDeleteToken = {
    id: 'CAN_DELETE_TOKEN',
    description: 'Allows to delete tokens',
    deprecated: false
};
exports.CanCreateUser = {
    id: 'CAN_CREATE_USER',
    description: 'Allows to create an user',
    deprecated: false
};
exports.CanResetUserPassword = {
    id: 'CAN_RESET_USER_PASSWORD',
    description: 'Allows to reset the password of an user',
    deprecated: false
};
exports.CanGetUser = {
    id: 'CAN_GET_USER',
    description: 'Allows to get an user',
    deprecated: false
};
exports.CanGetUsers = {
    id: 'CAN_GET_USERS',
    description: 'Allows to get all users',
    deprecated: false
};
exports.CanDeleteUser = {
    id: 'CAN_DELETE_USER',
    description: 'Allows to delete users',
    deprecated: false
};
exports.CanCreateUserRole = {
    id: 'CAN_CREATE_USER_ROLE',
    description: 'Allows to create an user role',
    deprecated: false
};
exports.CanGetUserRole = {
    id: 'CAN_GET_USER_ROLE',
    description: 'Allows to get an user role',
    deprecated: false
};
exports.CanGetUserRoles = {
    id: 'CAN_GET_USER_ROLES',
    description: 'Allows to get all user roles',
    deprecated: false
};
exports.CanDeleteUserRole = {
    id: 'CAN_DELETE_USER_ROLE',
    description: 'Allows to delete user role',
    deprecated: false
};
exports.CanGetPermission = {
    id: 'CAN_GET_PERMISSION',
    description: 'Allows to get a permission',
    deprecated: false
};
exports.CanGetPermissions = {
    id: 'CAN_GET_PERMISSIONS',
    description: 'Allows to get all permissions',
    deprecated: false
};
exports.CanCreateMemberPlan = {
    id: 'CAN_CREATE_MEMBER_PLAN',
    description: 'Allows to create a member plan',
    deprecated: false
};
exports.CanGetMemberPlan = {
    id: 'CAN_GET_MEMBER_PLAN',
    description: 'Allows to get a member plan',
    deprecated: false
};
exports.CanGetMemberPlans = {
    id: 'CAN_GET_MEMBER_PLANS',
    description: 'Allows to get all member plans',
    deprecated: false
};
exports.CanDeleteMemberPlan = {
    id: 'CAN_DELETE_MEMBER_PLAN',
    description: 'Allows to delete member plan',
    deprecated: false
};
exports.CanCreatePaymentMethod = {
    id: 'CAN_CREATE_PAYMENT_METHOD',
    description: 'Allows to create a payment method',
    deprecated: false
};
exports.CanGetPaymentMethod = {
    id: 'CAN_GET_PAYMENT_METHOD',
    description: 'Allows to get a payment method',
    deprecated: false
};
exports.CanGetPaymentMethods = {
    id: 'CAN_GET_PAYMENT_METHODS',
    description: 'Allows to get all payment methods',
    deprecated: false
};
exports.CanDeletePaymentMethod = {
    id: 'CAN_DELETE_PAYMENT_METHOD',
    description: 'Allows to delete payment method',
    deprecated: false
};
exports.CanCreateInvoice = {
    id: 'CAN_CREATE_INVOICE',
    description: 'Allows to create an invoice',
    deprecated: false
};
exports.CanGetInvoice = {
    id: 'CAN_GET_INVOICE',
    description: 'Allows to get an invoice',
    deprecated: false
};
exports.CanGetInvoices = {
    id: 'CAN_GET_INVOICES',
    description: 'Allows to get all invoices',
    deprecated: false
};
exports.CanDeleteInvoice = {
    id: 'CAN_DELETE_INVOICE',
    description: 'Allows to delete invoice',
    deprecated: false
};
exports.CanCreatePayment = {
    id: 'CAN_CREATE_PAYMENT',
    description: 'Allows to create a payment',
    deprecated: false
};
exports.CanGetPayment = {
    id: 'CAN_GET_PAYMENT',
    description: 'Allows to get an payment',
    deprecated: false
};
exports.CanGetPayments = {
    id: 'CAN_GET_PAYMENTS',
    description: 'Allows to get all payments',
    deprecated: false
};
exports.CanGetPaymentProviders = {
    id: 'CAN_GET_PAYMENT_PROVIDERS',
    description: 'Allows to get all payment providers',
    deprecated: false
};
exports.CanSendJWTLogin = {
    id: 'CAN_SEND_JWT_LOGIN',
    description: 'Allows to send a JWT Login',
    deprecated: false
};
exports.CanLoginEditor = {
    id: 'CAN_LOGIN_EDITOR',
    description: 'Allows to login editor',
    deprecated: false
};
exports.CanCreateSubscription = {
    id: 'CAN_CREATE_SUBSCRIPTION',
    description: 'Allows to create a subscription',
    deprecated: false
};
exports.CanGetSubscription = {
    id: 'CAN_GET_SUBSCRIPTION',
    description: 'Allows to get a subscription',
    deprecated: false
};
exports.CanGetSubscriptions = {
    id: 'CAN_GET_SUBSCRIPTIONS',
    description: 'Allows to get all subscriptions',
    deprecated: false
};
exports.CanDeleteSubscription = {
    id: 'CAN_DELETE_SUBSCRIPTION',
    description: 'Allows to delete a subscription',
    deprecated: false
};
exports.CanLoginAsOtherUser = {
    id: 'CAN_LOGIN_AS_OTHER_USER',
    description: 'Allows to login as other user',
    deprecated: false
};
exports.CanGetSettings = {
    id: 'CAN_GET_SETTINGS',
    description: 'Allows to get all settings',
    deprecated: false
};
exports.CanUpdateSettings = {
    id: 'CAN_UPDATE_SETTINGS',
    description: 'Allows to update settings',
    deprecated: false
};
exports.CanGetCommentRatingSystem = {
    id: 'CAN_GET_COMMENT_RATING_SYSTEM',
    description: 'Allows to get a comment rating system',
    deprecated: false
};
exports.CanCreateCommentRatingSystem = {
    id: 'CAN_CREATE_COMMENT_RATING_SYSTEM',
    description: 'Allows to create a comment rating system',
    deprecated: false
};
exports.CanUpdateCommentRatingSystem = {
    id: 'CAN_UPDATE_COMMENT_RATING_SYSTEM',
    description: 'Allows to update a comment rating system',
    deprecated: false
};
exports.CanDeleteCommentRatingSystem = {
    id: 'CAN_DELETE_COMMENT_RATING_SYSTEM',
    description: 'Allows to delete a comment rating system',
    deprecated: false
};
exports.CanCreateTag = {
    id: 'CAN_CREATE_TAG',
    description: 'Allows to create a tag',
    deprecated: false
};
exports.CanUpdateTag = {
    id: 'CAN_UPDATE_TAG',
    description: 'Allows to update a tag',
    deprecated: false
};
exports.CanGetTags = {
    id: 'CAN_GET_TAGS',
    description: 'Allows to get all tags',
    deprecated: false
};
exports.CanDeleteTag = {
    id: 'CAN_DELETE_TAG',
    description: 'Allows to delete a tag',
    deprecated: false
};
exports.CanGetPoll = {
    id: 'CAN_GET_POLL',
    description: 'Allows to get a poll',
    deprecated: false
};
exports.CanCreatePoll = {
    id: 'CAN_CREATE_POLL',
    description: 'Allows to create a poll',
    deprecated: false
};
exports.CanUpdatePoll = {
    id: 'CAN_UPDATE_POLL',
    description: 'Allows to update a poll',
    deprecated: false
};
exports.CanDeletePoll = {
    id: 'CAN_DELETE_POLL',
    description: 'Allows to delete a poll',
    deprecated: false
};
exports.AllPermissions = [
    exports.CanTakeActionOnComment,
    exports.CanCreateNavigation,
    exports.CanGetNavigation,
    exports.CanGetNavigations,
    exports.CanDeleteNavigation,
    exports.CanCreateAuthor,
    exports.CanGetAuthor,
    exports.CanGetAuthors,
    exports.CanDeleteAuthor,
    exports.CanCreateImage,
    exports.CanGetImage,
    exports.CanGetImages,
    exports.CanDeleteImage,
    exports.CanCreateArticle,
    exports.CanGetArticle,
    exports.CanGetArticles,
    exports.CanDeleteArticle,
    exports.CanGetArticlePreviewLink,
    exports.CanPublishArticle,
    exports.CanGetPeerArticle,
    exports.CanGetPeerArticles,
    exports.CanCreatePage,
    exports.CanGetPage,
    exports.CanGetPages,
    exports.CanDeletePage,
    exports.CanPublishPage,
    exports.CanGetPagePreviewLink,
    exports.CanUpdatePeerProfile,
    exports.CanGetPeerProfile,
    exports.CanCreatePeer,
    exports.CanGetPeer,
    exports.CanGetPeers,
    exports.CanDeletePeer,
    exports.CanCreateToken,
    exports.CanDeleteToken,
    exports.CanGetTokens,
    exports.CanCreateUser,
    exports.CanResetUserPassword,
    exports.CanGetUser,
    exports.CanGetUsers,
    exports.CanDeleteUser,
    exports.CanCreateUserRole,
    exports.CanGetUserRole,
    exports.CanGetUserRoles,
    exports.CanDeleteUserRole,
    exports.CanGetPermission,
    exports.CanGetPermissions,
    exports.CanGetComments,
    exports.CanUpdateComments,
    exports.CanDeleteComments,
    exports.CanCreateMemberPlan,
    exports.CanGetMemberPlan,
    exports.CanGetMemberPlans,
    exports.CanDeleteMemberPlan,
    exports.CanCreatePaymentMethod,
    exports.CanGetPaymentMethod,
    exports.CanGetPaymentMethods,
    exports.CanDeletePaymentMethod,
    exports.CanCreateInvoice,
    exports.CanGetInvoice,
    exports.CanGetInvoices,
    exports.CanDeleteInvoice,
    exports.CanCreatePayment,
    exports.CanGetPayment,
    exports.CanGetPayments,
    exports.CanGetPaymentProviders,
    exports.CanSendJWTLogin,
    exports.CanLoginEditor,
    exports.CanCreateSubscription,
    exports.CanGetSubscription,
    exports.CanGetSubscriptions,
    exports.CanDeleteSubscription,
    exports.CanLoginAsOtherUser,
    exports.CanGetSettings,
    exports.CanUpdateSettings,
    exports.CanGetCommentRatingSystem,
    exports.CanCreateCommentRatingSystem,
    exports.CanUpdateCommentRatingSystem,
    exports.CanDeleteCommentRatingSystem,
    exports.CanCreateTag,
    exports.CanUpdateTag,
    exports.CanGetTags,
    exports.CanDeleteTag,
    exports.CanGetPoll,
    exports.CanUpdatePoll,
    exports.CanDeletePoll,
    exports.CanCreatePoll
];
exports.EditorPermissions = [
    exports.CanGetComments,
    exports.CanUpdateComments,
    exports.CanTakeActionOnComment,
    exports.CanCreateAuthor,
    exports.CanGetAuthor,
    exports.CanGetAuthors,
    exports.CanCreateImage,
    exports.CanGetImage,
    exports.CanGetImages,
    exports.CanCreateArticle,
    exports.CanGetArticle,
    exports.CanGetArticles,
    exports.CanPublishArticle,
    exports.CanGetArticlePreviewLink,
    exports.CanCreatePage,
    exports.CanGetPage,
    exports.CanGetPages,
    exports.CanPublishPage,
    exports.CanGetPeer,
    exports.CanGetPeers,
    exports.CanGetPeerProfile,
    exports.CanLoginEditor,
    exports.CanGetSettings,
    exports.CanGetComments,
    exports.CanUpdateComments,
    exports.CanDeleteComments,
    exports.CanCreateCommentRatingSystem,
    exports.CanUpdateCommentRatingSystem,
    exports.CanDeleteCommentRatingSystem,
    exports.CanCreateTag,
    exports.CanUpdateTag,
    exports.CanGetTags,
    exports.CanDeleteTag,
    exports.CanGetPoll,
    exports.CanUpdatePoll,
    exports.CanDeletePoll,
    exports.CanCreatePoll
];
exports.PeerPermissions = [
    exports.CanGetPeerProfile,
    exports.CanGetSharedArticle,
    exports.CanGetSharedArticles
];
//# sourceMappingURL=permissions.js.map