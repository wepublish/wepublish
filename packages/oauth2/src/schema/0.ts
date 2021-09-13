export enum CollectionName {
  Migrations = 'migrations',
  AccessToken = 'access_token',
  AuthorizationCode = 'authorization_code',
  Session = 'session'
}

// NOTE: _id has to be of type any for insert operations not requiring _id to be provided.
export interface DBMigration {
  _id: any
  version: number
  createdAt: Date
}

export interface DBOAuth2Token {
  _id: any

  expiresAt: Date

  payload: any
}
