export interface Permission {
  name: string
  description: string
}

export const CanCreateAuthor: Permission = <Permission>{
  name: 'canCreateAuthor',
  description: 'Allows to create Authors'
}

export const CanGetAuthor: Permission = <Permission>{
  name: 'canGetAuthor',
  description: 'Allows to get Author'
}

export const AllPermissions: Permission[] = <Permission[]>[CanCreateAuthor, CanGetAuthor]

export const EditorPermissions: Permission[] = <Permission[]>[CanGetAuthor]
