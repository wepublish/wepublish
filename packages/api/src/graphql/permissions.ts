import {NotAuthorisedError, UserRole} from '..'

export interface Permission {
  id: string
  description: string
  deprecated: boolean
}

export const authorise = function (neededPermission: Permission, userRoles: UserRole[]): void {
  if (neededPermission.deprecated) {
    console.warn('Permission is deprecated', neededPermission)
  }
  const userPermissions = userRoles.reduce<string[]>((permissions, role) => {
    if (role.id === 'admin') {
      return role.permissionIDs.concat(AllPermissions.map(permission => permission.id))
    } else if (role.id === 'editor') {
      return role.permissionIDs.concat(EditorPermissions.map(permission => permission.id))
    } else {
      return role.permissionIDs.concat(permissions)
    }
  }, [])
  if (!userPermissions.some(permission => permission === neededPermission.id)) {
    throw new NotAuthorisedError()
  }
  return
}

export const CanGetNavigation: Permission = {
  id: 'CAN_GET_NAVIGATION',
  description: 'Allows to get navigation',
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

export const CanGetArticles: Permission = {
  id: 'CAN_GET_ARTICLES',
  description: 'Allows to get all articles',
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

export const CanCreateUser: Permission = {
  id: 'CAN_CREATE_USER',
  description: 'Allows to create an user',
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

export const AllPermissions: Permission[] = [
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
  CanCreatePage,
  CanGetPage,
  CanGetPages,
  CanDeletePage,
  CanPublishPage,
  CanCreateUser,
  CanGetUser,
  CanGetUsers,
  CanDeleteUser,
  CanCreateUserRole,
  CanGetUserRole,
  CanGetUserRoles,
  CanDeleteUserRole,
  CanGetPermission,
  CanGetPermissions
]

export const EditorPermissions: Permission[] = [
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
  CanPublishPage
]
