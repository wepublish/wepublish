import {Sequelize} from 'sequelize'

import {
  DBAdapter,
  CreateUserArgs,
  QueryOpts,
  GetUserForCredentialsArgs,
  User,
  OptionalUser
} from '@wepublish/api'

export class SQLAdapter implements DBAdapter {
  constructor() {
    const sequelize = new Sequelize('sqlite::memory:')

    async function test() {
      try {
        await sequelize.authenticate()
      } catch (err) {
        console.error(err)
      }
    }

    test()
  }

  createUser({id, email, password}: CreateUserArgs, {info}: QueryOpts): Promise<User> {
    return null as any
  }

  getUserForCredentials({}: GetUserForCredentialsArgs, {info}: QueryOpts): Promise<OptionalUser> {
    return null as any
  }
}
