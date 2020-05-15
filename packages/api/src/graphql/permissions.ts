import {NotAuthorisedError, UserRole} from '..'

export interface Permission {
  name: string
  description: string
}

export const authorise = function (neededPermission: Permission, userRoles: UserRole[]): void {
  const userPermissions = userRoles.reduce<Permission[]>((permissions, role) => {
    return role.permissions.concat(permissions)
  }, [])
  if (!userPermissions.some(permission => permission.name === neededPermission.name)) {
    throw new NotAuthorisedError()
  }
  return
}

export const CanGetNavigation: Permission = <Permission>{
  name: 'CanGetNavigation',
  description: 'Allows to get navigation'
}

export const CanCreateAuthor: Permission = <Permission>{
  name: 'canCreateAuthor',
  description: 'Allows to create authors'
}

export const CanGetAuthor: Permission = <Permission>{
  name: 'canGetAuthor',
  description: 'Allows to get author'
}

export const CanGetAuthors: Permission = <Permission>{
  name: 'canGetAuthors',
  description: 'Allows to all authors'
}

export const CanDeleteAuthor: Permission = <Permission>{
  name: 'canDeleteAuthor',
  description: 'Allows to delete authors'
}

export const CanCreateImage: Permission = <Permission>{
  name: 'canCreateImage',
  description: 'Allows to create images'
}

export const CanGetImage: Permission = <Permission>{
  name: 'canGetImage',
  description: 'Allows to get image'
}

export const CanGetImages: Permission = <Permission>{
  name: 'canGetImages',
  description: 'Allows to get all images'
}

export const CanDeleteImage: Permission = <Permission>{
  name: 'canDeleteImage',
  description: 'Allows to delete images'
}

export const CanCreateArticle: Permission = <Permission>{
  name: 'canCreateArticle',
  description: 'Allows to create articles'
}

export const CanGetArticle: Permission = <Permission>{
  name: 'canGetArticle',
  description: 'Allows to get article'
}

export const CanGetArticles: Permission = <Permission>{
  name: 'canGetArticles',
  description: 'Allows to get all articles'
}

export const CanPublishArticle: Permission = <Permission>{
  name: 'canPublishArticle',
  description: 'Allows to publish articles'
}

export const CanDeleteArticle: Permission = <Permission>{
  name: 'canDeleteArticle',
  description: 'Allows to delete articles'
}

export const CanCreatePage: Permission = <Permission>{
  name: 'canCreatePage',
  description: 'Allows to create Pages'
}

export const CanGetPage: Permission = <Permission>{
  name: 'canGetPage',
  description: 'Allows to get Page'
}

export const CanGetPages: Permission = <Permission>{
  name: 'canGetPages',
  description: 'Allows to get all Pages'
}

export const CanPublishPage: Permission = <Permission>{
  name: 'canPublishPage',
  description: 'Allows to publish Pages'
}

export const CanDeletePage: Permission = <Permission>{
  name: 'canDeletePage',
  description: 'Allows to delete Pages'
}

export const AllPermissions: Permission[] = <Permission[]>[
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
  CanPublishPage
]

export const EditorPermissions: Permission[] = <Permission[]>[
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
  CanPublishPage
]
