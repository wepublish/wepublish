export type Permission = {
  id: string;
  description: string;
  deprecated: boolean;
};

export const CanGetCrowdfunding: Permission = {
  id: 'CAN_GET_CROWDFUNDING',
  description: 'Allows to get crowdfunding',
  deprecated: false,
};

export const CanGetCrowdfundings: Permission = {
  id: 'CAN_GET_CROWDFUNDINGS',
  description: 'Allows to get crowdfundings',
  deprecated: false,
};

export const CanCreateCrowdfunding: Permission = {
  id: 'CAN_CREATE_CROWDFUNDING',
  description: 'Allows to create crowdfunding',
  deprecated: false,
};

export const CanUpdateCrowdfunding: Permission = {
  id: 'CAN_UPDATE_CROWDFUNDING',
  description: 'Allows to update crowdfunding',
  deprecated: false,
};

export const CanDeleteCrowdfunding: Permission = {
  id: 'CAN_DELETE_CROWDFUNDING',
  description: 'Allows to delete crowdfunding',
  deprecated: false,
};

export const CanGetNavigation: Permission = {
  id: 'CAN_GET_NAVIGATION',
  description: 'Allows to get navigation',
  deprecated: false,
};

export const CanGetNavigations: Permission = {
  id: 'CAN_GET_NAVIGATIONS',
  description: 'Allows to get all navigations',
  deprecated: false,
};

export const CanCreateNavigation: Permission = {
  id: 'CAN_CREATE_NAVIGATION',
  description: 'Allows to create navigation',
  deprecated: false,
};

export const CanDeleteNavigation: Permission = {
  id: 'CAN_DELETE_NAVIGATION',
  description: 'Allows to delete navigations',
  deprecated: false,
};

export const CanGetBanner: Permission = {
  id: 'CAN_GET_BANNER',
  description: 'Allows to get banner',
  deprecated: false,
};

export const CanGetBanners: Permission = {
  id: 'CAN_GET_BANNERS',
  description: 'Allows to get all banners',
  deprecated: false,
};

export const CanCreateBanner: Permission = {
  id: 'CAN_CREATE_BANNER',
  description: 'Allows to create banner',
  deprecated: false,
};

export const CanUpdateBanner: Permission = {
  id: 'CAN_UPDATE_BANNER',
  description: 'Allows to update banner',
  deprecated: false,
};

export const CanDeleteBanner: Permission = {
  id: 'CAN_DELETE_BANNER',
  description: 'Allows to delete banners',
  deprecated: false,
};

export const CanCreateAuthor: Permission = {
  id: 'CAN_CREATE_AUTHOR',
  description: 'Allows to create authors',
  deprecated: false,
};

export const CanGetAuthor: Permission = {
  id: 'CAN_GET_AUTHOR',
  description: 'Allows to get author',
  deprecated: false,
};

export const CanGetAuthors: Permission = {
  id: 'CAN_GET_AUTHORS',
  description: 'Allows to get all authors',
  deprecated: false,
};

export const CanDeleteAuthor: Permission = {
  id: 'CAN_DELETE_AUTHOR',
  description: 'Allows to delete a single author',
  deprecated: false,
};

export const CanCreateImage: Permission = {
  id: 'CAN_CREATE_IMAGE',
  description: 'Allows to create images',
  deprecated: false,
};

export const CanGetImage: Permission = {
  id: 'CAN_GET_IMAGE',
  description: 'Allows to get image',
  deprecated: false,
};

export const CanGetImages: Permission = {
  id: 'CAN_GET_IMAGES',
  description: 'Allows to get all images',
  deprecated: false,
};

export const CanDeleteImage: Permission = {
  id: 'CAN_DELETE_IMAGE',
  description: 'Allows to delete images',
  deprecated: false,
};

export const CanCreateArticle: Permission = {
  id: 'CAN_CREATE_ARTICLE',
  description: 'Allows to create articles',
  deprecated: false,
};

export const CanGetArticle: Permission = {
  id: 'CAN_GET_ARTICLE',
  description: 'Allows to get article',
  deprecated: false,
};

export const CanGetSharedArticle: Permission = {
  id: 'CAN_GET_SHARED_ARTICLE',
  description: 'Allows to get shared article',
  deprecated: false,
};

export const CanGetArticles: Permission = {
  id: 'CAN_GET_ARTICLES',
  description: 'Allows to get all articles',
  deprecated: false,
};

export const CanGetSharedArticles: Permission = {
  id: 'CAN_GET_SHARED_ARTICLES',
  description: 'Allows to get shared articles',
  deprecated: false,
};

export const CanGetPeerArticle: Permission = {
  id: 'CAN_GET_PEER_ARTICLE',
  description: 'Allows to get peer article',
  deprecated: false,
};

export const CanGetPeerArticles: Permission = {
  id: 'CAN_GET_PEER_ARTICLES',
  description: 'Allows to get all peer articles',
  deprecated: false,
};

export const CanPublishArticle: Permission = {
  id: 'CAN_PUBLISH_ARTICLE',
  description: 'Allows to publish articles',
  deprecated: false,
};

export const CanDeleteArticle: Permission = {
  id: 'CAN_DELETE_ARTICLE',
  description: 'Allows to delete articles',
  deprecated: false,
};

export const CanCreateApprovedComment: Permission = {
  id: 'CAN_CREATE_APPROVED_COMMENT',
  description: 'Allows to leave comment without pending approval',
  deprecated: false,
};

export const CanTakeActionOnComment: Permission = {
  id: 'CAN_TAKE_COMMENT_ACTION',
  description: 'Allows to take an action on comment',
  deprecated: false,
};

export const CanGetComments: Permission = {
  id: 'CAN_GET_COMMENTS',
  description: 'Allows to get all comments',
  deprecated: false,
};

export const CanUpdateComments: Permission = {
  id: 'CAN_UPDATE_COMMENTS',
  description: 'Allows to update a comment',
  deprecated: false,
};

export const CanDeleteComments: Permission = {
  id: 'CAN_DELETE_COMMENTS',
  description: 'Allows to delete comments',
  deprecated: false,
};

export const CanCreatePage: Permission = {
  id: 'CAN_CREATE_PAGE',
  description: 'Allows to create Pages',
  deprecated: false,
};

export const CanGetPage: Permission = {
  id: 'CAN_GET_PAGE',
  description: 'Allows to get Page',
  deprecated: false,
};

export const CanGetPages: Permission = {
  id: 'CAN_GET_PAGES',
  description: 'Allows to get all Pages',
  deprecated: false,
};

export const CanPublishPage: Permission = {
  id: 'CAN_PUBLISH_PAGE',
  description: 'Allows to publish Pages',
  deprecated: false,
};

export const CanDeletePage: Permission = {
  id: 'CAN_DELETE_PAGE',
  description: 'Allows to delete Pages',
  deprecated: false,
};

export const CanUpdatePeerProfile: Permission = {
  id: 'CAN_UPDATE_PEER_PROFILE',
  description: 'Allows to update peer profile',
  deprecated: false,
};

export const CanGetPeerProfile: Permission = {
  id: 'CAN_GET_PEER_PROFILE',
  description: 'Allows to get peer profile',
  deprecated: false,
};

export const CanCreatePeer: Permission = {
  id: 'CAN_CREATE_PEER',
  description: 'Allows to create peers',
  deprecated: false,
};

export const CanGetPeer: Permission = {
  id: 'CAN_GET_PEER',
  description: 'Allows to get peer',
  deprecated: false,
};

export const CanGetPeers: Permission = {
  id: 'CAN_GET_PEERS',
  description: 'Allows to get all peers',
  deprecated: false,
};

export const CanDeletePeer: Permission = {
  id: 'CAN_DELETE_PEER',
  description: 'Allows to delete peers',
  deprecated: false,
};

export const CanCreateToken: Permission = {
  id: 'CAN_CREATE_TOKEN',
  description: 'Allows to create tokens',
  deprecated: false,
};

export const CanGetTokens: Permission = {
  id: 'CAN_GET_TOKENS',
  description: 'Allows to get all tokens',
  deprecated: false,
};

export const CanDeleteToken: Permission = {
  id: 'CAN_DELETE_TOKEN',
  description: 'Allows to delete tokens',
  deprecated: false,
};

export const CanCreateUser: Permission = {
  id: 'CAN_CREATE_USER',
  description: 'Allows to create an user',
  deprecated: false,
};

export const CanResetUserPassword: Permission = {
  id: 'CAN_RESET_USER_PASSWORD',
  description: 'Allows to reset the password of an user',
  deprecated: false,
};

export const CanGetUser: Permission = {
  id: 'CAN_GET_USER',
  description: 'Allows to get an user',
  deprecated: false,
};

export const CanGetUsers: Permission = {
  id: 'CAN_GET_USERS',
  description: 'Allows to get all users',
  deprecated: false,
};

export const CanDeleteUser: Permission = {
  id: 'CAN_DELETE_USER',
  description: 'Allows to delete users',
  deprecated: false,
};

export const CanCreateUserRole: Permission = {
  id: 'CAN_CREATE_USER_ROLE',
  description: 'Allows to create an user role',
  deprecated: false,
};

export const CanGetUserRole: Permission = {
  id: 'CAN_GET_USER_ROLE',
  description: 'Allows to get an user role',
  deprecated: false,
};

export const CanGetUserRoles: Permission = {
  id: 'CAN_GET_USER_ROLES',
  description: 'Allows to get all user roles',
  deprecated: false,
};

export const CanDeleteUserRole: Permission = {
  id: 'CAN_DELETE_USER_ROLE',
  description: 'Allows to delete user role',
  deprecated: false,
};

export const CanGetPermission: Permission = {
  id: 'CAN_GET_PERMISSION',
  description: 'Allows to get a permission',
  deprecated: false,
};

export const CanGetPermissions: Permission = {
  id: 'CAN_GET_PERMISSIONS',
  description: 'Allows to get all permissions',
  deprecated: false,
};

export const CanCreateMemberPlan: Permission = {
  id: 'CAN_CREATE_MEMBER_PLAN',
  description: 'Allows to create a member plan',
  deprecated: false,
};

export const CanGetMemberPlan: Permission = {
  id: 'CAN_GET_MEMBER_PLAN',
  description: 'Allows to get a member plan',
  deprecated: false,
};

export const CanGetMemberPlans: Permission = {
  id: 'CAN_GET_MEMBER_PLANS',
  description: 'Allows to get all member plans',
  deprecated: false,
};

export const CanDeleteMemberPlan: Permission = {
  id: 'CAN_DELETE_MEMBER_PLAN',
  description: 'Allows to delete member plan',
  deprecated: false,
};

export const CanCreatePaymentMethod: Permission = {
  id: 'CAN_CREATE_PAYMENT_METHOD',
  description: 'Allows to create a payment method',
  deprecated: false,
};

export const CanGetPaymentMethod: Permission = {
  id: 'CAN_GET_PAYMENT_METHOD',
  description: 'Allows to get a payment method',
  deprecated: false,
};

export const CanGetPaymentMethods: Permission = {
  id: 'CAN_GET_PAYMENT_METHODS',
  description: 'Allows to get all payment methods',
  deprecated: false,
};

export const CanDeletePaymentMethod: Permission = {
  id: 'CAN_DELETE_PAYMENT_METHOD',
  description: 'Allows to delete payment method',
  deprecated: false,
};

export const CanCreateInvoice: Permission = {
  id: 'CAN_CREATE_INVOICE',
  description: 'Allows to create an invoice',
  deprecated: false,
};

export const CanGetInvoice: Permission = {
  id: 'CAN_GET_INVOICE',
  description: 'Allows to get an invoice',
  deprecated: false,
};

export const CanGetInvoices: Permission = {
  id: 'CAN_GET_INVOICES',
  description: 'Allows to get all invoices',
  deprecated: false,
};

export const CanDeleteInvoice: Permission = {
  id: 'CAN_DELETE_INVOICE',
  description: 'Allows to delete invoice',
  deprecated: false,
};

export const CanCreatePayment: Permission = {
  id: 'CAN_CREATE_PAYMENT',
  description: 'Allows to create a payment',
  deprecated: false,
};

export const CanGetPayment: Permission = {
  id: 'CAN_GET_PAYMENT',
  description: 'Allows to get an payment',
  deprecated: false,
};

export const CanGetPayments: Permission = {
  id: 'CAN_GET_PAYMENTS',
  description: 'Allows to get all payments',
  deprecated: false,
};

export const CanGetPaymentProviders: Permission = {
  id: 'CAN_GET_PAYMENT_PROVIDERS',
  description: 'Allows to get all payment providers',
  deprecated: false,
};

export const CanSendJWTLogin: Permission = {
  id: 'CAN_SEND_JWT_LOGIN',
  description: 'Allows to send a JWT Login',
  deprecated: false,
};

export const CanLoginEditor: Permission = {
  id: 'CAN_LOGIN_EDITOR',
  description: 'Allows to login editor',
  deprecated: false,
};

export const CanCreateSubscription: Permission = {
  id: 'CAN_CREATE_SUBSCRIPTION',
  description: 'Allows to create a subscription',
  deprecated: false,
};

export const CanGetSubscription: Permission = {
  id: 'CAN_GET_SUBSCRIPTION',
  description: 'Allows to get a subscription',
  deprecated: false,
};

export const CanGetSubscriptions: Permission = {
  id: 'CAN_GET_SUBSCRIPTIONS',
  description: 'Allows to get all subscriptions',
  deprecated: false,
};

export const CanDeleteSubscription: Permission = {
  id: 'CAN_DELETE_SUBSCRIPTION',
  description: 'Allows to delete a subscription',
  deprecated: false,
};

export const CanCancelSubscription: Permission = {
  id: 'CAN_DELETE_SUBSCRIPTION',
  description: 'Allows to delete a subscription',
  deprecated: false,
};

export const CanLoginAsOtherUser: Permission = {
  id: 'CAN_LOGIN_AS_OTHER_USER',
  description: 'Allows to login as other user',
  deprecated: false,
};

export const CanGetSettings: Permission = {
  id: 'CAN_GET_SETTINGS',
  description: 'Allows to get all settings',
  deprecated: false,
};

export const CanUpdateSettings: Permission = {
  id: 'CAN_UPDATE_SETTINGS',
  description: 'Allows to update settings',
  deprecated: false,
};

export const CanGetCommentRatingSystem: Permission = {
  id: 'CAN_GET_COMMENT_RATING_SYSTEM',
  description: 'Allows to get a comment rating system',
  deprecated: false,
};

export const CanCreateCommentRatingSystem: Permission = {
  id: 'CAN_CREATE_COMMENT_RATING_SYSTEM',
  description: 'Allows to create a comment rating system',
  deprecated: false,
};

export const CanUpdateCommentRatingSystem: Permission = {
  id: 'CAN_UPDATE_COMMENT_RATING_SYSTEM',
  description: 'Allows to update a comment rating system',
  deprecated: false,
};

export const CanDeleteCommentRatingSystem: Permission = {
  id: 'CAN_DELETE_COMMENT_RATING_SYSTEM',
  description: 'Allows to delete a comment rating system',
  deprecated: false,
};

export const CanCreateTag: Permission = {
  id: 'CAN_CREATE_TAG',
  description: 'Allows to create a tag',
  deprecated: false,
};

export const CanUpdateTag: Permission = {
  id: 'CAN_UPDATE_TAG',
  description: 'Allows to update a tag',
  deprecated: false,
};

export const CanGetTags: Permission = {
  id: 'CAN_GET_TAGS',
  description: 'Allows to get all tags',
  deprecated: false,
};

export const CanDeleteTag: Permission = {
  id: 'CAN_DELETE_TAG',
  description: 'Allows to delete a tag',
  deprecated: false,
};

export const CanGetPoll: Permission = {
  id: 'CAN_GET_POLL',
  description: 'Allows to get a poll',
  deprecated: false,
};

export const CanCreatePoll: Permission = {
  id: 'CAN_CREATE_POLL',
  description: 'Allows to create a poll',
  deprecated: false,
};

export const CanUpdatePoll: Permission = {
  id: 'CAN_UPDATE_POLL',
  description: 'Allows to update a poll',
  deprecated: false,
};

export const CanDeletePoll: Permission = {
  id: 'CAN_DELETE_POLL',
  description: 'Allows to delete a poll',
  deprecated: false,
};

export const CanGetPollVote: Permission = {
  id: 'CAN_GET_POLL_VOTE',
  description: 'Allows to get a poll vote',
  deprecated: false,
};

export const CanDeletePollVote: Permission = {
  id: 'CAN_DELETE_POLL_VOTE',
  description: 'Allows to delete a poll vote',
  deprecated: false,
};

export const CanGetEvent: Permission = {
  id: 'CAN_GET_EVENT',
  description: 'Allows to get an event',
  deprecated: false,
};

export const CanCreateEvent: Permission = {
  id: 'CAN_CREATE_EVENT',
  description: 'Allows to create an event',
  deprecated: false,
};

export const CanUpdateEvent: Permission = {
  id: 'CAN_UPDATE_EVENT',
  description: 'Allows to update an event',
  deprecated: false,
};

export const CanDeleteEvent: Permission = {
  id: 'CAN_DELETE_EVENT',
  description: 'Allows to delete an event',
  deprecated: false,
};

export const CanGetImportedEvents: Permission = {
  id: 'CAN_GET_IMPORTED_EVENTS',
  description: 'Allows to get imported events',
  deprecated: false,
};

export const CanGetConsent: Permission = {
  id: 'CAN_GET_CONSENT',
  description: 'Allows to get a consent',
  deprecated: false,
};

export const CanCreateConsent: Permission = {
  id: 'CAN_CREATE_CONSENT',
  description: 'Allows to create a consent',
  deprecated: false,
};

export const CanUpdateConsent: Permission = {
  id: 'CAN_UPDATE_CONSENT',
  description: 'Allows to update a consent',
  deprecated: false,
};

export const CanDeleteConsent: Permission = {
  id: 'CAN_DELETE_CONSENT',
  description: 'Allows to delete a consent',
  deprecated: false,
};

export const CanGetUserConsent: Permission = {
  id: 'CAN_GET_USER_CONSENT',
  description: 'Allows to get a consent',
  deprecated: false,
};

export const CanCreateUserConsent: Permission = {
  id: 'CAN_CREATE_USER_CONSENT',
  description: 'Allows to create a consent',
  deprecated: false,
};

export const CanUpdateUserConsent: Permission = {
  id: 'CAN_UPDATE_USER_CONSENT',
  description: 'Allows to update a consent',
  deprecated: false,
};

export const CanDeleteUserConsent: Permission = {
  id: 'CAN_DELETE_USER_CONSENT',
  description: 'Allows to delete a consent',
  deprecated: false,
};

/**
 * Subscription Settings
 */
export const CanGetSubscriptionFlows: Permission = {
  id: 'CAN_GET_SUBSCRIPTION_FLOWS',
  description: 'Allows to get subscription flows.',
  deprecated: false,
};

export const CanUpdateSubscriptionFlow: Permission = {
  id: 'CAN_UPDATE_SUBSCRIPTION_FLOW',
  description: 'Allows to update subscription flow.',
  deprecated: false,
};

export const CanCreateSubscriptionFlow: Permission = {
  id: 'CAN_CREATE_SUBSCRIPTION_FLOW',
  description: 'Allows to create a new subscription flow.',
  deprecated: false,
};

export const CanDeleteSubscriptionFlow: Permission = {
  id: 'CAN_DELETE_SUBSCRIPTION_FLOW',
  description: 'Allows to delete a subscription flow.',
  deprecated: false,
};

/**
 * Preview
 */
export const CanPreview: Permission = {
  id: 'CAN_PREVIEW',
  description: 'Allows to get a preview of articles, pages, comments etc.',
  deprecated: false,
};

/**
 * Mail templates
 */
export const CanGetMailTemplates: Permission = {
  id: 'CAN_GET_MAIL-TEMPLATES',
  description: 'Allows to get mail templates.',
  deprecated: false,
};

export const CanSyncMailTemplates: Permission = {
  id: 'CAN_SYNC_MAIL-TEMPLATES',
  description: 'Allowed to synchronize mail templates from mail provider.',
  deprecated: false,
};

/**
 * System mails
 */
export const CanGetSystemMails: Permission = {
  id: 'CAN_GET_SYSTEM_MAILS',
  description: 'Allows to get system mail list.',
  deprecated: false,
};

export const CanUpdateSystemMails: Permission = {
  id: 'CAN_UPDATE_SYSTEM_MAILS',
  description: 'Allows user to edit and save a system mail.',
  deprecated: false,
};

export const CanTestSystemMails: Permission = {
  id: 'CAN_TEST_SYSTEM_MAILS',
  description: 'Allows user to test a system mail.',
  deprecated: false,
};

/**
 * Periodic Job
 */
export const CanGetPeriodicJobLog: Permission = {
  id: 'CAN_GET_PERIODIC_JOB_LOG',
  description: 'Allows to get the periodic job log',
  deprecated: false,
};

/**
 * Block Styles
 */
export const CanCreateBlockStyle: Permission = {
  id: 'CAN_CREATE_BLOCK_STYLE',
  description: 'Allows to create a block style',
  deprecated: false,
};

export const CanUpdateBlockStyle: Permission = {
  id: 'CAN_UPDATE_BLOCK_STYLE',
  description: 'Allows to update a block style',
  deprecated: false,
};

export const CanDeleteBlockStyle: Permission = {
  id: 'CAN_DELETE_BLOCK_STYLE',
  description: 'Allows to delete a block style',
  deprecated: false,
};

export const CanGetAudienceStats: Permission = {
  id: 'CAN_GET_AUDIENCE_STATS',
  description: 'Allows reading statistics about the audience.',
  deprecated: false,
};

/**
 * Paywall
 */
export const CanCreatePaywall: Permission = {
  id: 'CAN_CREATE_PAYWALL',
  description: 'Allows to create a paywall',
  deprecated: false,
};

export const CanUpdatePaywall: Permission = {
  id: 'CAN_UPDATE_PAYWALL',
  description: 'Allows to update a paywall',
  deprecated: false,
};

export const CanDeletePaywall: Permission = {
  id: 'CAN_DELETE_PAYWALL',
  description: 'Allows to delete a paywall',
  deprecated: false,
};

/**
 * AI Settings
 */
export const CanGetAISettings: Permission = {
  id: 'CAN_GET_AI_SETTINGS',
  description: 'Allows to get AI provider settings',
  deprecated: false,
};

export const CanCreateAISettings: Permission = {
  id: 'CAN_CREATE_AI_SETTINGS',
  description: 'Allows to create AI provider settings',
  deprecated: false,
};

export const CanUpdateAISettings: Permission = {
  id: 'CAN_UPDATE_AI_SETTINGS',
  description: 'Allows to update AI provider settings',
  deprecated: false,
};

export const CanDeleteAISettings: Permission = {
  id: 'CAN_DELETE_AI_SETTINGS',
  description: 'Allows to delete AI provider settings',
  deprecated: false,
};

/**
 * Challenge Provider Settings
 */
export const CanGetChallengeProviderSettings: Permission = {
  id: 'CAN_GET_CHALLENGE_PROVIDER_SETTINGS',
  description: 'Allows to get challenge provider settings',
  deprecated: false,
};

export const CanCreateChallengeProviderSettings: Permission = {
  id: 'CAN_CREATE_CHALLENGE_PROVIDER_SETTINGS',
  description: 'Allows to create challenge provider settings',
  deprecated: false,
};

export const CanUpdateChallengeProviderSettings: Permission = {
  id: 'CAN_UPDATE_CHALLENGE_PROVIDER_SETTINGS',
  description: 'Allows to update challenge provider settings',
  deprecated: false,
};

export const CanDeleteChallengeProviderSettings: Permission = {
  id: 'CAN_DELETE_CHALLENGE_PROVIDER_SETTINGS',
  description: 'Allows to delete challenge provider settings',
  deprecated: false,
};

/**
 * Payment Provider Settings
 */
export const CanGetPaymentProviderSettings: Permission = {
  id: 'CAN_GET_PAYMENT_PROVIDER_SETTINGS',
  description: 'Allows to get payment provider settings',
  deprecated: false,
};

export const CanCreatePaymentProviderSettings: Permission = {
  id: 'CAN_CREATE_PAYMENT_PROVIDER_SETTINGS',
  description: 'Allows to create payment provider settings',
  deprecated: false,
};

export const CanUpdatePaymentProviderSettings: Permission = {
  id: 'CAN_UPDATE_PAYMENT_PROVIDER_SETTINGS',
  description: 'Allows to update payment provider settings',
  deprecated: false,
};

export const CanDeletePaymentProviderSettings: Permission = {
  id: 'CAN_DELETE_PAYMENT_PROVIDER_SETTINGS',
  description: 'Allows to delete payment provider settings',
  deprecated: false,
};

/**
 * Tracking Pixel Settings
 */
export const CanGetTrackingPixelSettings: Permission = {
  id: 'CAN_GET_TRACKING_PIXEL_SETTINGS',
  description: 'Allows to get tracking pixel settings',
  deprecated: false,
};

export const CanCreateTrackingPixelSettings: Permission = {
  id: 'CAN_CREATE_TRACKING_PIXEL_SETTINGS',
  description: 'Allows to create tracking pixel settings',
  deprecated: false,
};

export const CanUpdateTrackingPixelSettings: Permission = {
  id: 'CAN_UPDATE_TRACKING_PIXEL_SETTINGS',
  description: 'Allows to update tracking pixel settings',
  deprecated: false,
};

export const CanDeleteTrackingPixelSettings: Permission = {
  id: 'CAN_DELETE_TRACKING_PIXEL_SETTINGS',
  description: 'Allows to delete tracking pixel settings',
  deprecated: false,
};

/**
 * Mail Provider Settings
 */
export const CanGetMailProviderSettings: Permission = {
  id: 'CAN_GET_MAIL_PROVIDER_SETTINGS',
  description: 'Allows to get mail provider settings',
  deprecated: false,
};

export const CanCreateMailProviderSettings: Permission = {
  id: 'CAN_CREATE_MAIL_PROVIDER_SETTINGS',
  description: 'Allows to create mail provider settings',
  deprecated: false,
};

export const CanUpdateMailProviderSettings: Permission = {
  id: 'CAN_UPDATE_MAIL_PROVIDER_SETTINGS',
  description: 'Allows to update mail provider settings',
  deprecated: false,
};

export const CanDeleteMailProviderSettings: Permission = {
  id: 'CAN_DELETE_MAIL_PROVIDER_SETTINGS',
  description: 'Allows to delete mail provider settings',
  deprecated: false,
};

/**
 * Analytics Provider Settings Permissions
 */
export const CanGetAnalyticsProviderSettings: Permission = {
  id: 'CAN_GET_ANALYTICS_PROVIDER_SETTINGS',
  description: 'Allows to get analytics provider settings',
  deprecated: false,
};

export const CanCreateAnalyticsProviderSettings: Permission = {
  id: 'CAN_CREATE_ANALYTICS_PROVIDER_SETTINGS',
  description: 'Allows to create analytics provider settings',
  deprecated: false,
};

export const CanUpdateAnalyticsProviderSettings: Permission = {
  id: 'CAN_UPDATE_ANALYTICS_PROVIDER_SETTINGS',
  description: 'Allows to update analytics provider settings',
  deprecated: false,
};

export const CanDeleteAnalyticsProviderSettings: Permission = {
  id: 'CAN_DELETE_ANALYTICS_PROVIDER_SETTINGS',
  description: 'Allows to delete analytics provider settings',
  deprecated: false,
};

export const AllPermissions: Permission[] = [
  CanGetCrowdfunding,
  CanGetCrowdfundings,
  CanCreateCrowdfunding,
  CanUpdateCrowdfunding,
  CanDeleteCrowdfunding,
  CanTakeActionOnComment,
  CanCreateNavigation,
  CanGetNavigation,
  CanGetNavigations,
  CanDeleteNavigation,
  CanGetBanner,
  CanGetBanners,
  CanCreateBanner,
  CanUpdateBanner,
  CanDeleteBanner,
  CanCreateAuthor,
  CanGetAuthor,
  CanGetAuthors,
  CanDeleteAuthor,
  CanCreateImage,
  CanGetImage,
  CanGetImages,
  CanDeleteImage,
  CanCreateArticle,
  CanGetArticle,
  CanGetArticles,
  CanDeleteArticle,
  CanPublishArticle,
  CanGetPeerArticle,
  CanGetPeerArticles,
  CanCreatePage,
  CanGetPage,
  CanGetPages,
  CanDeletePage,
  CanPublishPage,
  CanPreview,
  CanUpdatePeerProfile,
  CanGetPeerProfile,
  CanCreatePeer,
  CanGetPeer,
  CanGetPeers,
  CanDeletePeer,
  CanCreateToken,
  CanDeleteToken,
  CanGetTokens,
  CanCreateUser,
  CanResetUserPassword,
  CanGetUser,
  CanGetUsers,
  CanDeleteUser,
  CanCreateUserRole,
  CanGetUserRole,
  CanGetUserRoles,
  CanDeleteUserRole,
  CanGetPermission,
  CanGetPermissions,
  CanGetComments,
  CanUpdateComments,
  CanDeleteComments,
  CanCreateMemberPlan,
  CanGetMemberPlan,
  CanGetMemberPlans,
  CanDeleteMemberPlan,
  CanCreatePaymentMethod,
  CanGetPaymentMethod,
  CanGetPaymentMethods,
  CanDeletePaymentMethod,
  CanCreateInvoice,
  CanGetInvoice,
  CanGetInvoices,
  CanDeleteInvoice,
  CanCreatePayment,
  CanGetPayment,
  CanGetPayments,
  CanGetPaymentProviders,
  CanSendJWTLogin,
  CanLoginEditor,
  CanCreateSubscription,
  CanGetSubscription,
  CanGetSubscriptions,
  CanDeleteSubscription,
  CanLoginAsOtherUser,
  CanGetSettings,
  CanUpdateSettings,
  CanGetCommentRatingSystem,
  CanCreateCommentRatingSystem,
  CanUpdateCommentRatingSystem,
  CanDeleteCommentRatingSystem,
  CanCreateTag,
  CanUpdateTag,
  CanGetTags,
  CanDeleteTag,
  CanGetPoll,
  CanUpdatePoll,
  CanDeletePoll,
  CanGetPollVote,
  CanDeletePollVote,
  CanCreatePoll,
  CanGetEvent,
  CanUpdateEvent,
  CanDeleteEvent,
  CanGetImportedEvents,
  CanCreateConsent,
  CanUpdateConsent,
  CanDeleteConsent,
  CanCreateEvent,
  CanGetSubscriptionFlows,
  CanUpdateSubscriptionFlow,
  CanCreateSubscriptionFlow,
  CanDeleteSubscriptionFlow,
  CanGetMailTemplates,
  CanGetPeriodicJobLog,
  CanSyncMailTemplates,
  CanGetSystemMails,
  CanUpdateSystemMails,
  CanTestSystemMails,
  CanCreateApprovedComment,
  CanCreateBlockStyle,
  CanUpdateBlockStyle,
  CanDeleteBlockStyle,
  CanCreatePaywall,
  CanUpdatePaywall,
  CanDeletePaywall,
  CanGetAudienceStats,
  CanGetAISettings,
  CanCreateAISettings,
  CanUpdateAISettings,
  CanDeleteAISettings,
  CanGetChallengeProviderSettings,
  CanCreateChallengeProviderSettings,
  CanUpdateChallengeProviderSettings,
  CanDeleteChallengeProviderSettings,
  CanGetPaymentProviderSettings,
  CanCreatePaymentProviderSettings,
  CanUpdatePaymentProviderSettings,
  CanDeletePaymentProviderSettings,
  CanGetTrackingPixelSettings,
  CanCreateTrackingPixelSettings,
  CanUpdateTrackingPixelSettings,
  CanDeleteTrackingPixelSettings,
  CanGetMailProviderSettings,
  CanCreateMailProviderSettings,
  CanUpdateMailProviderSettings,
  CanDeleteMailProviderSettings,
  CanGetAnalyticsProviderSettings,
  CanCreateAnalyticsProviderSettings,
  CanUpdateAnalyticsProviderSettings,
  CanDeleteAnalyticsProviderSettings,
];

export const EditorPermissions: Permission[] = [
  CanGetCrowdfunding,
  CanGetCrowdfundings,
  CanCreateCrowdfunding,
  CanUpdateCrowdfunding,
  CanDeleteCrowdfunding,
  CanGetComments,
  CanUpdateComments,
  CanTakeActionOnComment,
  CanCreateAuthor,
  CanGetAuthor,
  CanGetAuthors,
  CanGetBanner,
  CanGetBanners,
  CanCreateBanner,
  CanUpdateBanner,
  CanDeleteBanner,
  CanCreateImage,
  CanGetImage,
  CanGetImages,
  CanCreateArticle,
  CanGetArticle,
  CanGetArticles,
  CanPublishArticle,
  CanCreatePage,
  CanGetPage,
  CanGetPages,
  CanPublishPage,
  CanGetPeer,
  CanGetPeers,
  CanGetPeerProfile,
  CanLoginEditor,
  CanGetComments,
  CanUpdateComments,
  CanDeleteComments,
  CanCreateCommentRatingSystem,
  CanUpdateCommentRatingSystem,
  CanDeleteCommentRatingSystem,
  CanCreateTag,
  CanUpdateTag,
  CanGetTags,
  CanDeleteTag,
  CanGetPoll,
  CanUpdatePoll,
  CanDeletePoll,
  CanCreatePoll,
  CanGetEvent,
  CanUpdateEvent,
  CanDeleteEvent,
  CanCreateEvent,
  CanCreateConsent,
  CanUpdateConsent,
  CanDeleteConsent,
  CanCreateEvent,
  CanGetSubscriptionFlows,
  CanGetMailTemplates,
  CanGetPeriodicJobLog,
  CanCreateApprovedComment,
  CanPreview,
];

export const PeerPermissions: Permission[] = [
  CanGetPeerProfile,
  CanGetSharedArticle,
  CanGetSharedArticles,
];
