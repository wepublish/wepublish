import {DBTokenAdapter, Token, TokenInput} from '@wepublish/api'
import {Collection, Db} from 'mongodb'

import {CollectionName, DBToken} from '../schema'
import {generateToken} from '../utility'

export class MongoDBTokenAdapter implements DBTokenAdapter {
  private tokens: Collection<DBToken>

  constructor(db: Db) {
    this.tokens = db.collection(CollectionName.Tokens)
  }

  async createToken(input: TokenInput): Promise<Token> {
    const {ops} = await this.tokens.insertOne({
      name: input.name,
      token: generateToken()
    })

    const {_id: id, ...data} = ops[0]
    return {id, ...data}
  }

  async getTokens(): Promise<Token[]> {
    const tokens = await this.tokens.find().toArray()
    return tokens.map(({_id: id, ...data}) => ({id, ...data}))
  }

  async deleteToken(id: string): Promise<string | null> {
    const {deletedCount} = await this.tokens.deleteOne({_id: id})
    return deletedCount !== 0 ? id : null
  }
}
