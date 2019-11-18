import {StorageAdapter, User} from '@wepublish/api'

import {Remote} from '@karma.run/sdk'
import {createModelsAndTags} from '@karma.run/sdk/utility'
import {all, tag, create, data} from '@karma.run/sdk/expression'

import bcrypt from 'bcrypt'
import {SessionModel, UserModel, ModelTag, MigrationModel} from './model'

export interface KarmaStorageAdapterOptions {
  readonly url: string
  readonly user: string
  readonly password: string
  readonly hashCostFactor?: number
}

export class KarmaStorageAdapter implements StorageAdapter {
  private readonly user: string
  private readonly password: string
  private readonly hashCostFactor: number

  private readonly remote: Remote

  // TODO: Persistent / Refresh session
  // private session?: UserSession

  constructor({url, user, password, hashCostFactor = 10}: KarmaStorageAdapterOptions) {
    this.remote = new Remote(url)
    this.user = user
    this.password = password
    this.hashCostFactor = hashCostFactor
  }

  async initialize() {
    let session = await this.getKarmaSession()
    await session.resetDatabase()
    session = await this.getKarmaSession()

    try {
      const migrations = await session.do(all(tag(ModelTag.Migration)))
      console.log(migrations)
    } catch (err) {
      await session.do(
        createModelsAndTags({
          [ModelTag.Migration]: MigrationModel,
          [ModelTag.User]: UserModel,
          [ModelTag.Session]: SessionModel
        })
      )

      await session.do(
        create(tag(ModelTag.Migration), () =>
          data(d =>
            d.struct({
              version: d.int32(0)
            })
          )
        )
      )
    }
  }

  async getKarmaSession() {
    // TODO: Persistent / Refresh session
    // if (this.session) return this.session

    console.log(this.user)
    // return await this.remote.login(this.user, this.password)
    return await this.remote.adminLogin(this.password)
  }

  async getArticle() {
    return {} as any
  }

  async getArticleVersion() {
    return {} as any
  }

  async getArticleVersionBlocks() {
    return {} as any
  }

  async getArticleVersions() {
    return {} as any
  }

  async getArticles() {
    return {} as any
  }

  async getPage() {
    return {} as any
  }

  async getPageVersion() {
    return {} as any
  }

  async getPageVersionBlocks() {
    return {} as any
  }

  async getPageVersions() {
    return {} as any
  }

  async getPages() {
    return {} as any
  }

  async createArticle() {
    return {} as any
  }

  async createArticleVersion() {
    return {} as any
  }

  async updateArticleVersion() {
    return {} as any
  }

  async createPage() {
    return {} as any
  }

  async createPageVersion() {
    return {} as any
  }

  async updatePageVersion() {
    return {} as any
  }

  async createImage() {
    return {} as any
  }

  async updateImage() {
    return {} as any
  }

  async getImage() {
    return {} as any
  }

  async getImages() {
    return {} as any
  }

  async createNavigation() {
    return {} as any
  }

  async getNavigation() {
    return {} as any
  }

  async createAuthor() {
    return {} as any
  }

  async getAuthor() {
    return {} as any
  }

  async createPeer() {
    return {} as any
  }

  async getPeer() {
    return {} as any
  }

  async getPeers() {
    return {} as any
  }

  async createUser(id: string, email: string, password: string): Promise<User> {
    const session = await this.getKarmaSession()
    const passwordHash = await bcrypt.hash(password, this.hashCostFactor)

    await session.do(
      create(tag(ModelTag.User), () =>
        data(d =>
          d.struct({
            id: d.string(id),
            email: d.string(email),
            password: d.string(passwordHash)
          })
        )
      )
    )

    return {id, email}
  }

  async getUserForCredentials(email: string, password: string) {
    const session = await this.getKarmaSession()

    await session.do(
      all(tag(ModelTag.User)).filterList((index, value) => value.field('email').equal())
    )

    return {} as any
  }

  async createSession() {
    return {} as any
  }

  async getSession() {
    return {} as any
  }

  async deleteSession() {
    return {} as any
  }
}
