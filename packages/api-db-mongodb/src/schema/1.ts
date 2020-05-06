import {DBUser as DBUser0} from './0'
import {Permission} from '@wepublish/api'

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

  roles: string[]
}

export interface DBUserRole {
  _id: any

  createdAt: Date
  modifiedAt: Date

  name: string
  description?: string
  systemRole: boolean

  permissions: Permission[]
}
