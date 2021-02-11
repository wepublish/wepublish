import {NotAuthorisedError} from '../error'
import {UserRole} from '../db/userRole'

export interface Permission {
  id: string
  description: string
  deprecated: boolean
}

export function authorise(neededPermission: Permission, userRoles: UserRole[]): void {
  if (!isAuthorised(neededPermission, userRoles)) {
    throw new NotAuthorisedError()
  }
}

export function isAuthorised(neededPermission: Permission, userRoles: UserRole[]): boolean {
  if (neededPermission.deprecated) {
    console.warn('Permission is deprecated', neededPermission)
  }

  const userPermissions = userRoles.reduce<string[]>((permissions, role) => {
    if (role.id === 'admin') {
      return [...permissions, ...AllPermissions.map(permission => permission.id)]
    } else if (role.id === 'editor') {
      return [...permissions, ...EditorPermissions.map(permission => permission.id)]
    } else if (role.id === 'peer') {
      return [...permissions, ...PeerPermissions.map(permission => permission.id)]
    } else {
      return [...permissions, ...role.permissionIDs]
    }
  }, [])

  return userPermissions.some(permission => permission === neededPermission.id)
}

export const CanGetNavigation: Permission = {
  id: 'CAN_GET_NAVIGATION',
  description: 'Allows to get navigation',
  deprecated: false
}

export const CanGetNavigations: Permission = {
  id: 'CAN_GET_NAVIGATIONS',
  description: 'Allows to get all navigations',
  deprecated: false
}

export const CanCreateNavigation: Permission = {
  id: 'CAN_CREATE_NAVIGATION',
  description: 'Allows to create navigation',
  deprecated: false
}

export const CanDeleteNavigation: Permission = {
  id: 'CAN_DELETE_NAVIGATION',
  description: 'Allows to delete navigations',
  deprecated: false
}

export const CanCreateAuthor: Permission = {
  id: 'CAN_CREATE_AUTHOR',
  description: 'Allows to create authors',
  deprecated: false
}

export const CanGetAuthor: Permission = {
  id: 'CAN_GET_AUTHOR',
  description: 'Allows to get author',
  deprecated: false
}

export const CanGetAuthors: Permission = {
  id: 'CAN_GET_AUTHORS',
  description: 'Allows to all authors',
  deprecated: false
}

export const CanDeleteAuthor: Permission = {
  id: 'CAN_DELETE_AUTHORS',
  description: 'Allows to delete authors',
  deprecated: false
}

export const CanCreateImage: Permission = {
  id: 'CAN_CREATE_IMAGE',
  description: 'Allows to create images',
  deprecated: false
}

export const CanGetImage: Permission = {
  id: 'CAN_GET_IMAGE',
  description: 'Allows to get image',
  deprecated: false
}

export const CanGetImages: Permission = {
  id: 'CAN_GET_IMAGES',
  description: 'Allows to get all images',
  deprecated: false
}

export const CanDeleteImage: Permission = {
  id: 'CAN_DELETE_IMAGE',
  description: 'Allows to delete images',
  deprecated: false
}

export const CanCreateArticle: Permission = {
  id: 'CAN_CREATE_ARTICLE',
  description: 'Allows to create articles',
  deprecated: false
}

export const CanGetArticle: Permission = {
  id: 'CAN_GET_ARTICLE',
  description: 'Allows to get article',
  deprecated: false
}

export const CanGetSharedArticle: Permission = {
  id: 'CAN_GET_SHARED_ARTICLE',
  description: 'Allows to get shared article',
  deprecated: false
}

export const CanGetArticles: Permission = {
  id: 'CAN_GET_ARTICLES',
  description: 'Allows to get all articles',
  deprecated: false
}

export const CanGetSharedArticles: Permission = {
  id: 'CAN_GET_SHARED_ARTICLES',
  description: 'Allows to get shared articles',
  deprecated: false
}

export const CanGetPeerArticle: Permission = {
  id: 'CAN_GET_PEER_ARTICLE',
  description: 'Allows to get peer article',
  deprecated: false
}

export const CanGetPeerArticles: Permission = {
  id: 'CAN_GET_PEER_ARTICLES',
  description: 'Allows to get all peer articles',
  deprecated: false
}

export const CanPublishArticle: Permission = {
  id: 'CAN_PUBLISH_ARTICLE',
  description: 'Allows to publish articles',
  deprecated: false
}

export const CanDeleteArticle: Permission = {
  id: 'CAN_DELETE_ARTICLE',
  description: 'Allows to delete articles',
  deprecated: false
}

export const CanTakeActionOnComment: Permission = {
  id: 'CAN_TAKE_COMMENT_ACTION',
  description: 'Allows to take an action on comment',
  deprecated: false
}

export const CanGetComments: Permission = {
  id: 'CAN_GET_COMMENTS',
  description: 'Allows to get all comments',
  deprecated: false
}

export const CanCreatePage: Permission = {
  id: 'CAN_CREATE_PAGE',
  description: 'Allows to create Pages',
  deprecated: false
}

export const CanGetPage: Permission = {
  id: 'CAN_GET_PAGE',
  description: 'Allows to get Page',
  deprecated: false
}

export const CanGetPages: Permission = {
  id: 'CAN_GET_PAGES',
  description: 'Allows to get all Pages',
  deprecated: false
}

export const CanPublishPage: Permission = {
  id: 'CAN_PUBLISH_PAGE',
  description: 'Allows to publish Pages',
  deprecated: false
}

export const CanDeletePage: Permission = {
  id: 'CAN_DELETE_PAGE',
  description: 'Allows to delete Pages',
  deprecated: false
}

export const CanUpdatePeerProfile: Permission = {
  id: 'CAN_UPDATE_PEER_PROFILE',
  description: 'Allows to update peer profile',
  deprecated: false
}

export const CanGetPeerProfile: Permission = {
  id: 'CAN_GET_PEER_PROFILE',
  description: 'Allows to get peer profile',
  deprecated: false
}

export const CanCreatePeer: Permission = {
  id: 'CAN_CREATE_PEER',
  description: 'Allows to create peers',
  deprecated: false
}

export const CanGetPeer: Permission = {
  id: 'CAN_GET_PEER',
  description: 'Allows to get peer',
  deprecated: false
}

export const CanGetPeers: Permission = {
  id: 'CAN_GET_PEERS',
  description: 'Allows to get all peers',
  deprecated: false
}

export const CanDeletePeer: Permission = {
  id: 'CAN_DELETE_PEER',
  description: 'Allows to delete peers',
  deprecated: false
}

export const CanCreateToken: Permission = {
  id: 'CAN_CREATE_TOKEN',
  description: 'Allows to create tokens',
  deprecated: false
}

export const CanGetTokens: Permission = {
  id: 'CAN_GET_TOKENS',
  description: 'Allows to get all tokens',
  deprecated: false
}

export const CanDeleteToken: Permission = {
  id: 'CAN_DELETE_TOKEN',
  description: 'Allows to delete tokens',
  deprecated: false
}

export const CanCreateUser: Permission = {
  id: 'CAN_CREATE_USER',
  description: 'Allows to create an user',
  deprecated: false
}

export const CanResetUserPassword: Permission = {
  id: 'CAN_RESET_USER_PASSWORD',
  description: 'Allows to reset the password of an user',
  deprecated: false
}

export const CanGetUser: Permission = {
  id: 'CAN_GET_USER',
  description: 'Allows to get an user',
  deprecated: false
}

export const CanGetUsers: Permission = {
  id: 'CAN_GET_USERS',
  description: 'Allows to get all users',
  deprecated: false
}

export const CanDeleteUser: Permission = {
  id: 'CAN_DELETE_USER',
  description: 'Allows to delete users',
  deprecated: false
}

export const CanCreateUserRole: Permission = {
  id: 'CAN_CREATE_USER_ROLE',
  description: 'Allows to create an user role',
  deprecated: false
}

export const CanGetUserRole: Permission = {
  id: 'CAN_GET_USER_ROLE',
  description: 'Allows to get an user role',
  deprecated: false
}

export const CanGetUserRoles: Permission = {
  id: 'CAN_GET_USER_ROLES',
  description: 'Allows to get all user roles',
  deprecated: false
}

export const CanDeleteUserRole: Permission = {
  id: 'CAN_DELETE_USER_ROLE',
  description: 'Allows to delete user role',
  deprecated: false
}

export const CanGetPermission: Permission = {
  id: 'CAN_GET_PERMISSION',
  description: 'Allows to get a permission',
  deprecated: false
}

export const CanGetPermissions: Permission = {
  id: 'CAN_GET_PERMISSIONS',
  description: 'Allows to get all permissions',
  deprecated: false
}

export const CanCreateMemberPlan: Permission = {
  id: 'CAN_CREATE_MEMBER_PLAN',
  description: 'Allows to create a member plan',
  deprecated: false
}

export const CanGetMemberPlan: Permission = {
  id: 'CAN_GET_MEMBER_PLAN',
  description: 'Allows to get a member plan',
  deprecated: false
}

export const CanGetMemberPlans: Permission = {
  id: 'CAN_GET_MEMBER_PLANS',
  description: 'Allows to get all member plans',
  deprecated: false
}

export const CanDeleteMemberPlan: Permission = {
  id: 'CAN_DELETE_MEMBER_PLAN',
  description: 'Allows to delete member plan',
  deprecated: false
}

export const CanCreatePaymentMethod: Permission = {
  id: 'CAN_CREATE_PAYMENT_METHOD',
  description: 'Allows to create a payment method',
  deprecated: false
}

export const CanGetPaymentMethod: Permission = {
  id: 'CAN_GET_PAYMENT_METHOD',
  description: 'Allows to get a payment method',
  deprecated: false
}

export const CanGetPaymentMethods: Permission = {
  id: 'CAN_GET_PAYMENT_METHODS',
  description: 'Allows to get all payment methods',
  deprecated: false
}

export const CanDeletePaymentMethod: Permission = {
  id: 'CAN_DELETE_PAYMENT_METHOD',
  description: 'Allows to delete payment method',
  deprecated: false
}

export const CanCreateInvoice: Permission = {
  id: 'CAN_CREATE_INVOICE',
  description: 'Allows to create an invoice',
  deprecated: false
}

export const CanGetInvoice: Permission = {
  id: 'CAN_GET_INVOICE',
  description: 'Allows to get an invoice',
  deprecated: false
}

export const CanGetInvoices: Permission = {
  id: 'CAN_GET_INVOICES',
  description: 'Allows to get all invoices',
  deprecated: false
}

export const CanDeleteInvoice: Permission = {
  id: 'CAN_DELETE_INVOICE',
  description: 'Allows to delete invoice',
  deprecated: false
}

export const CanCreatePayment: Permission = {
  id: 'CAN_CREATE_PAYMENT',
  description: 'Allows to create a payment',
  deprecated: false
}

export const CanGetPayment: Permission = {
  id: 'CAN_GET_PAYMENT',
  description: 'Allows to get an payment',
  deprecated: false
}

export const CanGetPayments: Permission = {
  id: 'CAN_GET_PAYMENTS',
  description: 'Allows to get all payments',
  deprecated: false
}

export const CanGetPaymentProviders: Permission = {
  id: 'CAN_GET_PAYMENT_PROVIDERS',
  description: 'Allows to get all payment providers',
  deprecated: false
}

export const CanSendJWTLogin: Permission = {
  id: 'CAN_SEND_JWT_LOGIN',
  description: 'Allows to send a JWT Login',
  deprecated: false
}

export const CanLoginEditor: Permission = {
  id: 'CAN_LOGIN_EDITOR',
  description: 'Allows to login editor',
  deprecated: false
}

export const AllPermissions: Permission[] = [
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
  CanPublishArticle,
  CanGetPeerArticle,
  CanGetPeerArticles,
  CanCreatePage,
  CanGetPage,
  CanGetPages,
  CanDeletePage,
  CanPublishPage,
  CanUpdatePeerProfile,
  CanGetPeerProfile,
  CanCreatePeer,
  CanGetPeer,
  CanGetPeers,
  CanDeletePeer,
  CanCreateToken,
  CanDeleteToken,
  CanGetTokens,
  CanDeleteToken,
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
  CanLoginEditor
]

export const EditorPermissions: Permission[] = [
  CanGetComments,
  CanTakeActionOnComment,
  CanCreateAuthor,
  CanGetAuthor,
  CanGetAuthors,
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
  CanLoginEditor
]

export const PeerPermissions: Permission[] = [
  CanGetPeerProfile,
  CanGetSharedArticle,
  CanGetSharedArticles
]
