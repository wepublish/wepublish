import {DBUser as DBUser0} from './0'

export enum CollectionName {
  Migrations = 'migrations',
  Users = 'users',
  UserRoles = 'users.roles',
  Sessions = 'sessions',
  Navigations = 'navigations',
  Authors = 'authors',
  Images = 'images',

  Articles = 'articles',
  ArticlesHistory = 'articles.history',

  Pages = 'pages',
  PagesHistory = 'pages.history'
}

export interface DBUser extends DBUser0 {
  name: string

  roles: DBUserRole[]
}

export interface DBUserRole {
  _id: any

  createdAt: Date
  modifiedAt: Date

  systemRole: Boolean

  name: string
  description?: string
}
