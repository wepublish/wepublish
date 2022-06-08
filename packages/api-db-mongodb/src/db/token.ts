import {DBTokenAdapter, Token, TokenInput} from '@wepublish/api'
import {Collection, Db} from 'mongodb'
import {generateToken} from '../utility'
import {CollectionName, DBToken} from './schema'

export class MongoDBTokenAdapter implements DBTokenAdapter {
  private tokens: Collection<DBToken>

  constructor(db: Db) {
    this.tokens = db.collection(CollectionName.Tokens)
  }

  async createToken(input: TokenInput): Promise<Token> {
    const {ops} = await this.tokens.insertOne({
      createdAt: new Date(),
      modifiedAt: new Date(),
      name: input.name,
      token: generateToken(),
      roleIDs: input.roleIDs
    })

    const {_id: id, ...data} = ops[0]
    return {id, ...data}
  }

  async deleteToken(id: string): Promise<string | null> {
    const {deletedCount} = await this.tokens.deleteOne({_id: id})
    return deletedCount !== 0 ? id : null
  }
}
