// https://github.com/wesbos/waait/blob/master/index.js
import {act} from '@testing-library/react'

export function wait(amount = 0) {
  return new Promise(resolve => setTimeout(resolve, amount))
}

// Use this in your test after mounting if you need just need to let the query finish
export async function actWait(amount = 0) {
  await act(async () => {
    await wait(amount)
  })
}

const CanGetNavigation = {
  id: 'CAN_GET_NAVIGATION',
  description: 'Allows to get navigation',
  deprecated: false
}

const CanGetNavigations = {
  id: 'CAN_GET_NAVIGATIONS',
  description: 'Allows to get all navigations',
  deprecated: false
}

const CanCreateNavigation = {
  id: 'CAN_CREATE_NAVIGATION',
  description: 'Allows to create navigation',
  deprecated: false
}

const CanDeleteNavigation = {
  id: 'CAN_DELETE_NAVIGATION',
  description: 'Allows to delete navigations',
  deprecated: false
}

const CanCreateAuthor = {
  id: 'CAN_CREATE_AUTHOR',
  description: 'Allows to create authors',
  deprecated: false
}

const CanGetAuthor = {
  id: 'CAN_GET_AUTHOR',
  description: 'Allows to get author',
  deprecated: false
}

const CanGetAuthors = {
  id: 'CAN_GET_AUTHORS',
  description: 'Allows to all authors',
  deprecated: false
}

const CanDeleteAuthor = {
  id: 'CAN_DELETE_AUTHORS',
  description: 'Allows to delete authors',
  deprecated: false
}

const CanCreateImage = {
  id: 'CAN_CREATE_IMAGE',
  description: 'Allows to create images',
  deprecated: false
}

const CanGetImage = {
  id: 'CAN_GET_IMAGE',
  description: 'Allows to get image',
  deprecated: false
}

const CanGetImages = {
  id: 'CAN_GET_IMAGES',
  description: 'Allows to get all images',
  deprecated: false
}

const CanDeleteImage = {
  id: 'CAN_DELETE_IMAGE',
  description: 'Allows to delete images',
  deprecated: false
}

const CanCreateArticle = {
  id: 'CAN_CREATE_ARTICLE',
  description: 'Allows to create articles',
  deprecated: false
}

const CanGetArticle = {
  id: 'CAN_GET_ARTICLE',
  description: 'Allows to get article',
  deprecated: false
}

const CanGetSharedArticle = {
  id: 'CAN_GET_SHARED_ARTICLE',
  description: 'Allows to get shared article',
  deprecated: false
}

const CanGetArticles = {
  id: 'CAN_GET_ARTICLES',
  description: 'Allows to get all articles',
  deprecated: false
}

const CanGetSharedArticles = {
  id: 'CAN_GET_SHARED_ARTICLES',
  description: 'Allows to get shared articles',
  deprecated: false
}

const CanGetPeerArticle = {
  id: 'CAN_GET_PEER_ARTICLE',
  description: 'Allows to get peer article',
  deprecated: false
}

const CanGetPeerArticles = {
  id: 'CAN_GET_PEER_ARTICLES',
  description: 'Allows to get all peer articles',
  deprecated: false
}

const CanPublishArticle = {
  id: 'CAN_PUBLISH_ARTICLE',
  description: 'Allows to publish articles',
  deprecated: false
}

const CanDeleteArticle = {
  id: 'CAN_DELETE_ARTICLE',
  description: 'Allows to delete articles',
  deprecated: false
}

const CanGetArticlePreviewLink = {
  id: 'CAN_GET_ARTICLE_PREVIEW_LINK',
  description: 'Allows to get preview links for articles',
  deprecated: false
}

const CanTakeActionOnComment = {
  id: 'CAN_TAKE_COMMENT_ACTION',
  description: 'Allows to take an action on comment',
  deprecated: false
}

const CanGetComments = {
  id: 'CAN_GET_COMMENTS',
  description: 'Allows to get all comments',
  deprecated: false
}

const CanCreatePage = {
  id: 'CAN_CREATE_PAGE',
  description: 'Allows to create Pages',
  deprecated: false
}

const CanGetPage = {
  id: 'CAN_GET_PAGE',
  description: 'Allows to get Page',
  deprecated: false
}

const CanGetPages = {
  id: 'CAN_GET_PAGES',
  description: 'Allows to get all Pages',
  deprecated: false
}

const CanPublishPage = {
  id: 'CAN_PUBLISH_PAGE',
  description: 'Allows to publish Pages',
  deprecated: false
}

const CanDeletePage = {
  id: 'CAN_DELETE_PAGE',
  description: 'Allows to delete Pages',
  deprecated: false
}

const CanGetPagePreviewLink = {
  id: 'CAN_GET_PAGE_PREVIEW_LINK',
  description: 'Allows to get preview links for pages',
  deprecated: false
}

const CanUpdatePeerProfile = {
  id: 'CAN_UPDATE_PEER_PROFILE',
  description: 'Allows to update peer profile',
  deprecated: false
}

const CanGetPeerProfile = {
  id: 'CAN_GET_PEER_PROFILE',
  description: 'Allows to get peer profile',
  deprecated: false
}

const CanCreatePeer = {
  id: 'CAN_CREATE_PEER',
  description: 'Allows to create peers',
  deprecated: false
}

const CanGetPeer = {
  id: 'CAN_GET_PEER',
  description: 'Allows to get peer',
  deprecated: false
}

const CanGetPeers = {
  id: 'CAN_GET_PEERS',
  description: 'Allows to get all peers',
  deprecated: false
}

const CanDeletePeer = {
  id: 'CAN_DELETE_PEER',
  description: 'Allows to delete peers',
  deprecated: false
}

const CanCreateToken = {
  id: 'CAN_CREATE_TOKEN',
  description: 'Allows to create tokens',
  deprecated: false
}

const CanGetTokens = {
  id: 'CAN_GET_TOKENS',
  description: 'Allows to get all tokens',
  deprecated: false
}

const CanDeleteToken = {
  id: 'CAN_DELETE_TOKEN',
  description: 'Allows to delete tokens',
  deprecated: false
}

const CanCreateUser = {
  id: 'CAN_CREATE_USER',
  description: 'Allows to create an user',
  deprecated: false
}

const CanResetUserPassword = {
  id: 'CAN_RESET_USER_PASSWORD',
  description: 'Allows to reset the password of an user',
  deprecated: false
}

const CanGetUser = {
  id: 'CAN_GET_USER',
  description: 'Allows to get an user',
  deprecated: false
}

const CanGetUsers = {
  id: 'CAN_GET_USERS',
  description: 'Allows to get all users',
  deprecated: false
}

const CanDeleteUser = {
  id: 'CAN_DELETE_USER',
  description: 'Allows to delete users',
  deprecated: false
}

const CanCreateUserRole = {
  id: 'CAN_CREATE_USER_ROLE',
  description: 'Allows to create an user role',
  deprecated: false
}

const CanGetUserRole = {
  id: 'CAN_GET_USER_ROLE',
  description: 'Allows to get an user role',
  deprecated: false
}

const CanGetUserRoles = {
  id: 'CAN_GET_USER_ROLES',
  description: 'Allows to get all user roles',
  deprecated: false
}

const CanDeleteUserRole = {
  id: 'CAN_DELETE_USER_ROLE',
  description: 'Allows to delete user role',
  deprecated: false
}

const CanGetPermission = {
  id: 'CAN_GET_PERMISSION',
  description: 'Allows to get a permission',
  deprecated: false
}

const CanGetPermissions = {
  id: 'CAN_GET_PERMISSIONS',
  description: 'Allows to get all permissions',
  deprecated: false
}

const CanCreateMemberPlan = {
  id: 'CAN_CREATE_MEMBER_PLAN',
  description: 'Allows to create a member plan',
  deprecated: false
}

const CanGetMemberPlan = {
  id: 'CAN_GET_MEMBER_PLAN',
  description: 'Allows to get a member plan',
  deprecated: false
}

const CanGetMemberPlans = {
  id: 'CAN_GET_MEMBER_PLANS',
  description: 'Allows to get all member plans',
  deprecated: false
}

const CanDeleteMemberPlan = {
  id: 'CAN_DELETE_MEMBER_PLAN',
  description: 'Allows to delete member plan',
  deprecated: false
}

const CanCreatePaymentMethod = {
  id: 'CAN_CREATE_PAYMENT_METHOD',
  description: 'Allows to create a payment method',
  deprecated: false
}

const CanGetPaymentMethod = {
  id: 'CAN_GET_PAYMENT_METHOD',
  description: 'Allows to get a payment method',
  deprecated: false
}

const CanGetPaymentMethods = {
  id: 'CAN_GET_PAYMENT_METHODS',
  description: 'Allows to get all payment methods',
  deprecated: false
}

const CanDeletePaymentMethod = {
  id: 'CAN_DELETE_PAYMENT_METHOD',
  description: 'Allows to delete payment method',
  deprecated: false
}

const CanCreateInvoice = {
  id: 'CAN_CREATE_INVOICE',
  description: 'Allows to create an invoice',
  deprecated: false
}

const CanGetInvoice = {
  id: 'CAN_GET_INVOICE',
  description: 'Allows to get an invoice',
  deprecated: false
}

const CanGetInvoices = {
  id: 'CAN_GET_INVOICES',
  description: 'Allows to get all invoices',
  deprecated: false
}

const CanDeleteInvoice = {
  id: 'CAN_DELETE_INVOICE',
  description: 'Allows to delete invoice',
  deprecated: false
}

const CanCreatePayment = {
  id: 'CAN_CREATE_PAYMENT',
  description: 'Allows to create a payment',
  deprecated: false
}

const CanGetPayment = {
  id: 'CAN_GET_PAYMENT',
  description: 'Allows to get an payment',
  deprecated: false
}

const CanGetPayments = {
  id: 'CAN_GET_PAYMENTS',
  description: 'Allows to get all payments',
  deprecated: false
}

const CanGetPaymentProviders = {
  id: 'CAN_GET_PAYMENT_PROVIDERS',
  description: 'Allows to get all payment providers',
  deprecated: false
}

const CanSendJWTLogin = {
  id: 'CAN_SEND_JWT_LOGIN',
  description: 'Allows to send a JWT Login',
  deprecated: false
}

const CanLoginEditor = {
  id: 'CAN_LOGIN_EDITOR',
  description: 'Allows to login editor',
  deprecated: false
}

const CanCreateSubscription = {
  id: 'CAN_CREATE_SUBSCRIPTION',
  description: 'Allows to create a subscription',
  deprecated: false
}

const CanGetSubscription = {
  id: 'CAN_GET_SUBSCRIPTION',
  description: 'Allows to get a subscription',
  deprecated: false
}

const CanGetSubscriptions = {
  id: 'CAN_GET_SUBSCRIPTIONS',
  description: 'Allows to get all subscriptions',
  deprecated: false
}

const CanDeleteSubscription = {
  id: 'CAN_DELETE_SUBSCRIPTION',
  description: 'Allows to delete a subscription',
  deprecated: false
}

const CanLoginAsOtherUser = {
  id: 'CAN_LOGIN_AS_OTHER_USER',
  description: 'Allows to login as other user',
  deprecated: false
}

const CanGetSettings = {
  id: 'CAN_GET_SETTINGS',
  description: 'Allows to get all settings',
  deprecated: false
}

const CanUpdateSettings = {
  id: 'CAN_UPDATE_SETTINGS',
  description: 'Allows to update settings',
  deprecated: false
}

export const AllPermissions = [
  CanTakeActionOnComment,
  CanCreateNavigation,
  CanGetNavigation,
  CanGetNavigations,
  CanDeleteNavigation,
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
  CanGetArticlePreviewLink,
  CanPublishArticle,
  CanGetPeerArticle,
  CanGetPeerArticles,
  CanCreatePage,
  CanGetPage,
  CanGetPages,
  CanDeletePage,
  CanPublishPage,
  CanGetPagePreviewLink,
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
  CanGetSharedArticles,
  CanGetSharedArticle
]

const adminRole = {
  id: 'admin',
  description: 'Admin',
  name: 'admin',
  systemRole: true,
  permissions: AllPermissions
}

export const sessionWithPermissions = {
  session: {
    email: 'dev@abc.ch',
    sessionToken: 'abcdefg',
    sessionRoles: [adminRole]
  }
}
