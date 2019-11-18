import {struct, string, dateTime, int32} from '@karma.run/sdk/model'

export enum ModelTag {
  Migration = 'migration',
  User = 'user',
  Session = 'session'
}

export const MigrationModel = struct({
  version: int32
})

export const UserModel = struct({
  id: string,
  email: string,
  password: string
})

export const SessionModel = struct({
  userID: string,
  token: string,
  expiryDate: dateTime
})
