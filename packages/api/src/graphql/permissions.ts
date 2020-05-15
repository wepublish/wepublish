export interface Permission {
  name: string
  description: string
}

export const CanCreateAuthor: Permission = <Permission>{
  name: 'canCreateAuthor',
  description: 'Allows to create authors'
}

export const CanDeleteAuthor: Permission = <Permission>{
  name: 'canDeleteAuthor',
  description: 'Allows to delete authors'
}

export const CanGetAuthor: Permission = <Permission>{
  name: 'canGetAuthor',
  description: 'Allows to get an author'
}

export const CanCreateImage: Permission = <Permission>{
  name: 'canCreateImage',
  description: 'Allows to create images'
}

export const CanDeleteImage: Permission = <Permission>{
  name: 'canDeleteImage',
  description: 'Allows to delete images'
}

export const CanCreateArticle: Permission = <Permission>{
  name: 'canCreateArticle',
  description: 'Allows to create articles'
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
  CanDeleteAuthor,
  CanCreateImage,
  CanDeleteImage,
  CanCreateArticle,
  CanDeleteArticle,
  CanPublishArticle,
  CanCreatePage,
  CanDeletePage,
  CanPublishPage
]

export const EditorPermissions: Permission[] = <Permission[]>[
  CanCreateAuthor,
  CanGetAuthor,
  CanDeleteAuthor,
  CanCreateImage,
  CanDeleteImage,
  CanCreateArticle,
  CanDeleteArticle,
  CanPublishArticle,
  CanCreatePage,
  CanDeletePage,
  CanPublishPage
]
